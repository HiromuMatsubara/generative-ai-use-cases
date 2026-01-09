"""Agent management for the agent core runtime."""

import json
import logging
import uuid
from collections.abc import AsyncGenerator
from typing import Any

import boto3
from strands import Agent as StrandsAgent
from strands.models import BedrockModel
from strands.tools import tool
from strands_tools.browser import AgentCoreBrowser

from .config import extract_model_info, get_max_iterations, get_system_prompt, supports_prompt_cache, supports_tools_cache
from .tools import ToolManager
from .types import Message, ModelInfo
from .utils import (
    process_messages,
    process_prompt,
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Initialize Bedrock AgentCore client (will be set when needed)
agent_core_client = None

# Initialize the Browser tool
browser_tool = AgentCoreBrowser(region="us-east-1")


class SubAgent:
    """Class to represent a sub-agent with its description and ARN"""

    def __init__(self, name: str, description: str, arn: str):
        self.name = name
        self.description = description
        self.arn = arn

    def create_tool_function(self):
        """Create a tool function for this specific sub-agent"""

        # Capture self in closure
        sub_agent_instance = self

        def agent_tool(task: str, session_id: str | None = None) -> str:
            """Dynamic docstring for sub-agent tool.

            Args:
                task: The task or question to delegate to the sub-agent
                session_id: Optional session ID for maintaining conversation context

            Returns:
                The response from the sub-agent
            """
            return sub_agent_instance._invoke_agent(task, session_id)

        # Set function metadata
        agent_tool.__name__ = f"call_{self.name.lower().replace(' ', '_')}_agent"
        agent_tool.__doc__ = f"{self.description}\nUse this when you need: {self.description.lower()}"

        return tool(agent_tool)

    def _invoke_agent(self, task: str, session_id: str | None = None) -> str:
        """Internal method to invoke this specific agent"""
        global agent_core_client

        # Initialize client if not already done
        if agent_core_client is None:
            agent_core_client = boto3.client("bedrock-agentcore", region_name="us-east-1")  # fixed to us-east-1 for now

        sid = session_id or str(uuid.uuid4())

        try:
            # Format payload according to Bedrock AgentCore API requirements
            formatted_payload = {"prompt": task}

            # Serialize payload to JSON bytes as required by AWS API
            payload_bytes = json.dumps(formatted_payload).encode("utf-8")

            logger.info(f"Invoking sub-agent {self.name} with ARN: {self.arn}")

            response = agent_core_client.invoke_agent_runtime(agentRuntimeArn=self.arn, runtimeSessionId=sid, payload=payload_bytes)

            # Process and return the response
            if "text/event-stream" in response.get("contentType", ""):
                # Handle streaming response
                content = []
                for line in response["response"].iter_lines(chunk_size=10):
                    if line:
                        line = line.decode("utf-8")
                        if line.startswith("data: "):
                            line = line[6:]
                            content.append(line)
                return "\n".join(content)

            elif response.get("contentType") == "application/json":
                # Handle standard JSON response
                content = []
                for chunk in response.get("response", []):
                    content.append(chunk.decode("utf-8"))
                return "".join(content)

            else:
                # Handle other response types
                return str(response)

        except Exception as e:
            logger.error(f"Error calling {self.name} agent: {str(e)}")
            return f"Error: Failed to call {self.name} agent - {str(e)}"


class IterationLimitExceededError(Exception):
    """Exception raised when iteration limit is exceeded"""

    pass


class AgentManager:
    """Manages Strands agent creation and execution."""

    def __init__(self):
        self.tool_manager = ToolManager()
        self.max_iterations = get_max_iterations()
        self.iteration_count = 0

    def set_session_info(self, session_id: str, trace_id: str):
        """Set session and trace IDs"""
        self.tool_manager.set_session_info(session_id, trace_id)

    def iteration_limit_handler(self, **ev):
        if ev.get("init_event_loop"):
            self.iteration_count = 0
        if ev.get("start_event_loop"):
            self.iteration_count += 1
            if self.iteration_count > self.max_iterations:
                raise IterationLimitExceededError(f"Event loop reached maximum iteration count ({self.max_iterations}). Please contact the administrator.")

    async def process_request_streaming(
        self,
        messages: list[Message] | list[dict[str, Any]],
        system_prompt: str | None,
        prompt: str | list[dict[str, Any]],
        model_info: ModelInfo,
        user_id: str | None = None,
        mcp_servers: list[str] | None = None,
        sub_agents: list[dict[str, str]] | None = None,
        session_id: str | None = None,
        agent_id: str | None = None,
        code_execution_enabled: bool | None = False,
    ) -> AsyncGenerator[str]:
        """Process a request and yield streaming responses as raw events"""
        try:
            # Set session info if provided
            if session_id:
                self.set_session_info(session_id, session_id)

            # Extract model info
            model_id, region = extract_model_info(model_info)

            # Combine system prompts
            combined_system_prompt = get_system_prompt(system_prompt)

            # Get tools (MCP handling is done in ToolManager)
            tools = self.tool_manager.get_tools_with_options(code_execution_enabled=code_execution_enabled, mcp_servers=mcp_servers)
            logger.info(f"Loaded {len(tools)} base tools (code execution: {code_execution_enabled})")

            # Log sub-agents if provided and add them as tools
            if sub_agents:
                logger.info(f"Sub-agents configured: {len(sub_agents)}")

                # Create SubAgent instances from the provided configuration
                SUB_AGENTS = []
                for sub_agent_config in sub_agents:
                    sub_agent = SubAgent(name=sub_agent_config.get("name", "Unknown"), description=sub_agent_config.get("description", "No description"), arn=sub_agent_config.get("arn", ""))
                    SUB_AGENTS.append(sub_agent)
                    logger.debug(f"  - {sub_agent.name}: {sub_agent.arn}")

                # Create tool functions for each sub-agent and add to tools list
                for sub_agent in SUB_AGENTS:
                    try:
                        sub_agent_tool = sub_agent.create_tool_function()
                        tools.append(sub_agent_tool)
                        logger.info(f"Added sub-agent tool: {sub_agent.name}")
                    except Exception as e:
                        logger.error(f"Failed to create tool for sub-agent {sub_agent.name}: {e}")

                logger.info(f"Total tools available: {len(tools)}")

            # Log agent info
            if agent_id:
                logger.debug(f"Processing agent: {agent_id}")

            # Create boto3 session and Bedrock model
            session = boto3.Session(region_name=region)

            # Configure caching based on model support (loaded from environment variable)
            bedrock_model_params = {
                "model_id": model_id,
                "boto_session": session,
            }

            # Only enable caching for officially supported models
            if supports_prompt_cache(model_id):
                bedrock_model_params["cache_prompt"] = "default"

                if supports_tools_cache(model_id):
                    bedrock_model_params["cache_tools"] = "default"

            bedrock_model = BedrockModel(**bedrock_model_params)

            # Process messages and prompt using utility functions
            processed_messages = process_messages(messages)
            processed_prompt = process_prompt(prompt)

            # Create Strands agent and stream response
            agent = StrandsAgent(
                system_prompt=combined_system_prompt,
                messages=processed_messages,
                model=bedrock_model,
                tools=tools,
                callback_handler=self.iteration_limit_handler,
            )

            async for event in agent.stream_async(processed_prompt):
                if "event" in event:
                    yield json.dumps(event, ensure_ascii=False) + "\n"

        except Exception as e:
            logger.error(f"Error processing agent request: {e}", exc_info=True)
            error_event = {
                "event": {
                    "internalServerException": {
                        "message": f"An error occurred while processing your request: {str(e)}",
                    }
                }
            }
            yield json.dumps(error_event, ensure_ascii=False) + "\n"
        finally:
            # Cleanup is handled automatically by the dynamic MCP client
            if user_id:
                logger.debug(f"Session cleanup for user {user_id} handled automatically")
