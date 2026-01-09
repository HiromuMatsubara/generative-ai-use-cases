"""Lambda function to list AgentCore Runtime agents."""

import json
import logging
import os
from typing import Any, Dict

import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Get region from environment
REGION = os.environ.get("REGION", "us-east-1")


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    List all available AgentCore Runtime agents.
    
    Args:
        event: API Gateway event
        context: Lambda context
        
    Returns:
        API Gateway response with list of runtimes
    """
    logger.info(f"Event: {json.dumps(event)}")
    
    try:
        # Initialize Bedrock Agent Runtime client
        client = boto3.client("bedrock-agentcore-control", region_name=REGION)
        
        # List all agent runtimes
        response = client.list_agent_runtimes()
        
        # Format the response
        runtimes = []
        for runtime in response.get("agentRuntimes", []):
            runtimes.append({
                "name": runtime.get("agentRuntimeName", "Unnamed Runtime"),
                "description": runtime.get("description", "No description available"),
                "arn": runtime.get("agentRuntimeArn", ""),
                "status": runtime.get("status", "UNKNOWN"),
                "createdAt": runtime.get("createdAt").isoformat() if runtime.get("createdAt") else None,
                "updatedAt": runtime.get("updatedAt").isoformat() if runtime.get("updatedAt") else None,
            })
        
        logger.info(f"Found {len(runtimes)} AgentCore runtimes")
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "runtimes": runtimes,
                "count": len(runtimes),
            }),
        }
        
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        error_message = e.response.get("Error", {}).get("Message", str(e))
        
        logger.error(f"AWS ClientError ({error_code}): {error_message}")
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "error": "Failed to list AgentCore runtimes",
                "message": error_message,
                "code": error_code,
                "runtimes": [],
                "count": 0,
            }),
        }
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps({
                "error": "Failed to list AgentCore runtimes",
                "message": str(e),
                "runtimes": [],
                "count": 0,
            }),
        }
