import middy from "@middy/core";
import { injectLambdaContext } from "@aws-lambda-powertools/logger";
import errorLogger from "@middy/error-logger";
import { logger } from "./lib/logger";
import { getSecretValue } from "./lib/sm-client";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import { FireblocksWeb3Provider } from "@fireblocks/fireblocks-web3-provider";
// import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import { FireblocksSDK, TransactionStatus } from "fireblocks-sdk";
import { SQSEvent } from "aws-lambda";
import { IExecuteQueue } from "./interface";
import { formatBytes32String } from "ethers/lib/utils";

const STOX_MARKET_ABI = require("./lib/abis/StoxMarket.json");

export const onExecute = async ({ Records }: SQSEvent) => {
  logger.info("Executing onExecute", { Records });

  assert.ok(process.env.FIREBLOCKS_API_SECRET_NAME);
  assert.ok(process.env.FIREBLOCKS_API_KEY_NAME);
  assert.ok(process.env.CHAIN_ID);
  assert.ok(process.env.STOX_ADDRESS);
  assert.ok(process.env.ASSET_ID);


  const CHAIN_ID = Number(process.env.CHAIN_ID);
  const STOX_ADDRESS = process.env.STOX_ADDRESS;
  const ASSET_ID = process.env.ASSET_ID;

  const [apiSecret, apiKey] = await Promise.all<string>([
    getSecretValue(process.env.FIREBLOCKS_API_SECRET_NAME),
    getSecretValue(process.env.FIREBLOCKS_API_KEY_NAME),
  ]);

  const fireblocksClient = new FireblocksSDK(apiSecret, apiKey);

  for (const record of Records) {
    const { body } = record;
    const { vaultId, side, amount, tokenId } = JSON.parse(
      body
    ) as IExecuteQueue;

    const eip1193Provider = new FireblocksWeb3Provider({
      privateKey: apiSecret,
      apiKey,
      vaultAccountIds: vaultId,
      chainId: CHAIN_ID,
    });
    const provider = new ethers.providers.Web3Provider(eip1193Provider);
    const signer = provider.getSigner();
    const stoxContract = new ethers.Contract(
      STOX_ADDRESS,
      STOX_MARKET_ABI,
      signer
    );
    const maker = await fireblocksClient.getDepositAddresses(vaultId, ASSET_ID);
    const encodefunc = stoxContract.contract.methods
      .execute({
        order: {
          side,
          maker,
          tokenId,
          amount,
          ceiling: ethers.utils.parseEther(side ? "0" : "100000"),
        },
        r: formatBytes32String(""),
        s: formatBytes32String(""),
        v: 0,
      })
      .encodeABI();
    await stoxContract.multicall(encodefunc);
  }
};

export const handler = middy(onExecute)
  .use(injectLambdaContext(logger))
  .use(
    errorLogger({
      logger: logger.error.bind(logger),
    })
  );
