#!/usr/bin/env node
import 'source-map-support/register'
import { App } from 'aws-cdk-lib'
import { MarketTradingBotServiceStack } from '../lib/service.stack'
import { MarketTradingBotServicePipelineStack } from '../lib/service-pipeline.stack'
import { MarketTradingBotServiceBuildStack } from '../lib/service-build.stack'

const app = new App()

// eslint-disable-next-line no-new
new MarketTradingBotServicePipelineStack(app, 'MarketTradingBotServicePipeline', {
  env: {
    region: 'eu-central-1',
    account: '110017516369',
  },
  mapMigrationProjectId: '6DG8ZDSP1W',
})

// eslint-disable-next-line no-new
new MarketTradingBotServiceStack(app, 'MarketTradingBotService', {
  env: {
    region: 'eu-central-1',
    account: '921116721311',
  },
  stage: 'Development',
  mapMigrationProjectId: '6DG8ZDSP1W',
})

// eslint-disable-next-line no-new
new MarketTradingBotServiceBuildStack(app, 'MarketTradingBotServiceBuild', {
  env: {
    region: 'eu-central-1',
    account: '921116721311',
  },
  stage: 'Development',
})
