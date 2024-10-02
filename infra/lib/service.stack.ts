import { Construct } from 'constructs'
import { Stack, StackProps, Tags } from 'aws-cdk-lib'
import { MarketTradingBotService } from './service'
import { Topic, Subscription, SubscriptionProtocol } from 'aws-cdk-lib/aws-sns'

export class MarketTradingBotServiceStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps & {
      stage: string
      mapMigrationProjectId: string
    }
  ) {
    super(scope, id, props)

    const serviceName = id.toLowerCase()
    const serviceStage = props.stage.toLowerCase()

    const alarmsTopic = new Topic(this, `Alarms`)
    // eslint-disable-next-line no-new
    new Subscription(this, `Subscription`, {
      topic: alarmsTopic,
      protocol: SubscriptionProtocol.EMAIL,
      endpoint: `alerting-aws-${serviceStage}@republik.io`,
    })

    Tags.of(this).add('service-name', serviceName)
    Tags.of(this).add('service-stage', serviceStage)
    Tags.of(this).add('map-migrated', props.mapMigrationProjectId)

    // eslint-disable-next-line no-new
    new MarketTradingBotService(this, 'MarketTradingBotService', {
      serviceStage,
      alarmsTopic,
    })
  }
}
