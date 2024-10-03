import middy from "@middy/core";
import { injectLambdaContext } from "@aws-lambda-powertools/logger";
import errorLogger from "@middy/error-logger";
import { logger } from "./lib/logger";
import { getSecretValue } from "./lib/sm-client";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { FireblocksWeb3Provider } from "@fireblocks/fireblocks-web3-provider";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { FireblocksSDK, TransactionStatus } from "fireblocks-sdk";
import { SQSEvent } from "aws-lambda";

const STOX_MARKET_ABI = require("./lib/abis/StoxMarket.json");

export const onExecute = async ({ Records }: SQSEvent) => {
  
  logger.info("Executing onExecute", { Records });

  assert.ok(process.env.FIREBLOCKS_API_SECRET_NAME);
  assert.ok(process.env.FIREBLOCKS_API_KEY_NAME);
  assert.ok(process.env.CHAIN_ID);
  assert.ok(process.env.STOX_ADDRESS);

  const CHAIN_ID = Number(process.env.CHAIN_ID);
  const STOX_ADDRESS = process.env.STOX_ADDRESS;

  const [apiSecret, apiKey] = await Promise.all<string>([
    getSecretValue(process.env.FIREBLOCKS_API_SECRET_NAME),
    getSecretValue(process.env.FIREBLOCKS_API_KEY_NAME),
  ]);

  // const fireblocksClient = new FireblocksSDK(apiSecret, apiKey);

  const eip1193Provider = new FireblocksWeb3Provider({
    privateKey: apiSecret,
    apiKey,
    vaultAccountIds: OPERATOR_VAULT_ACCOUNT_ID,
    chainId: CHAIN_ID,
  });
  const provider = new ethers.providers.Web3Provider(eip1193Provider);
  const signer = provider.getSigner();
  const stoxContract = new ethers.Contract(
    STOX_ADDRESS,
    STOX_MARKET_ABI,
    signer
  );

  await stoxContract
    .multicall
    // readyExecuteUserVaults.map((userVault) => userVault.encode)
    ();
};

export const handler = middy(onExecute)
  .use(injectLambdaContext(logger))
  .use(
    errorLogger({
      logger: logger.error.bind(logger),
    })
  );
