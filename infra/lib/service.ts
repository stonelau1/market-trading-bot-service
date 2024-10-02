import { Schedule } from 'aws-cdk-lib/aws-events'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { Construct } from 'constructs'
import { Scheduler } from './scheduler'
import { Duration } from 'aws-cdk-lib'
import { Architecture } from 'aws-cdk-lib/aws-lambda'
import { StringParameter } from 'aws-cdk-lib/aws-ssm'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb'

export interface IMarketTradingBotService {
  serviceStage: string
  alarmsTopic: Topic
}

export class MarketTradingBotService extends Construct {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(scope: Construct, id: string, props: IMarketTradingBotService) {
    super(scope, id)

    const serviceStage = props.serviceStage.toLowerCase()
    const isProduction = serviceStage === 'production'

    
  }
}
