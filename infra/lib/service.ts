import { Schedule } from "aws-cdk-lib/aws-events";
import { Topic } from "aws-cdk-lib/aws-sns";
import { Construct } from "constructs";
import { Scheduler } from "./scheduler";
import { Duration } from "aws-cdk-lib";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { createQueue } from "./create-queue";
import { NodejsFunction, SourceMapMode } from "aws-cdk-lib/aws-lambda-nodejs";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

export interface IMarketTradingBotService {
  serviceStage: string;
  alarmsTopic: Topic;
}

export class MarketTradingBotService extends Construct {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(scope: Construct, id: string, props: IMarketTradingBotService) {
    super(scope, id);

    const serviceStage = props.serviceStage.toLowerCase();
    const isProduction = serviceStage === "production";

    const fireblocksApiSecret = Secret.fromSecretNameV2(
      this,
      "apiSecret",
      `${props.serviceStage}/fireblocks/api-secret`
    );

    const fireblocksApiKey = Secret.fromSecretNameV2(
      this,
      "apiKey",
      `${props.serviceStage}/fireblocks/api-key`
    );

    const stoxAddress = StringParameter.valueForStringParameter(
      this,
      `/${props.serviceStage}/fireblocks/creator-token-contract-address`
    )

    const rpkArbitrumAssetId =
      StringParameter.valueForStringParameter(
        this,
        `/${props.serviceStage}/fireblocks/fireblocks-withdraw-arbitrum-asset-id`
      );

    const CHAIN_ID = props.serviceStage === "production" ? "42161" : "421614";

    const executeQ = createQueue(this, "ExecuteQ");

    const onExecute = new NodejsFunction(this, "onExecute", {
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      memorySize: 384,
      timeout: Duration.minutes(3),
      entry: "../app/src/on-execute.queue.ts",
      environment: {
        FIREBLOCKS_API_SECRET_NAME: fireblocksApiSecret.secretName,
        FIREBLOCKS_API_KEY_NAME: fireblocksApiKey.secretName,
        STOX_ADDRESS: stoxAddress,
        ASSET_ID: rpkArbitrumAssetId,
        CHAIN_ID,
        NODE_OPTIONS: "--enable-source-maps",
      },
      bundling: {
        sourceMap: true,
        sourceMapMode: SourceMapMode.DEFAULT,
      },
    });

    onExecute.addEventSource(
      new SqsEventSource(executeQ, {
        batchSize: 1,
        reportBatchItemFailures: true,
      })
    );

    fireblocksApiSecret.grantRead(onExecute);
    fireblocksApiKey.grantRead(onExecute);
  }
}
