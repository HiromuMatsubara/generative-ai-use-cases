import {
  Function,
  FunctionProps,
  Code,
  LayerVersion,
} from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';

export interface PrebuiltFunctionProps
  extends Omit<FunctionProps, 'code' | 'handler'> {
  readonly entry?: string;
  readonly handler?: string;
  readonly layers?: LayerVersion[];

  // Unused for
  readonly bundling?: {
    nodeModules?: string[];
    externalModules?: string[];
  };
}

export class PrebuiltFunction extends Function {
  constructor(scope: Construct, id: string, props: PrebuiltFunctionProps) {
    const { entry, handler, layers, ...functionProps } = props;

    // Extract function name from entry path
    // e.g., './lambda/predict.ts' -> 'predict'
    // e.g., './lambda/useCaseBuilder/createUseCase.ts' -> 'createUseCase'
    let functionName: string;
    if (entry) {
      const entryPath = entry.replace('./lambda/', '');
      functionName = path.basename(entryPath, '.ts');
    } else {
      functionName = id;
    }

    const codePath = path.join(__dirname, '../../lambda-dist', functionName);

    super(scope, id, {
      ...functionProps,
      code: Code.fromAsset(codePath),
      handler: handler ?? 'index.handler',
      layers,
    });
  }
}
