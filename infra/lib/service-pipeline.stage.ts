import { Construct } from 'constructs'
import { Stage, StageProps } from 'aws-cdk-lib'
import { MarketTradingBotServiceStack } from './service.stack'

/**
 * Deployable unit
 */
export class MarketTradingBotServicePipelineStage extends Stage {
  constructor(
    scope: Construct,
    id: string,
    props: StageProps & {
      mapMigrationProjectId: string
    }
  ) {
    super(scope, id, props)

    // eslint-disable-next-line no-new
    new MarketTradingBotServiceStack(this, 'MarketTradingBotService', {
      ...props,
      stage: id.toLowerCase(),
      mapMigrationProjectId: props.mapMigrationProjectId,
    })
  }
}
