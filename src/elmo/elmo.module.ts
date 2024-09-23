import { Module } from '@nestjs/common';
import { OscpController } from './adapter/in/oscp.controller';
import { AvailableCapacityNegotiationCronjobService } from './adapter/in/cronjob/available-capacity-negotiation.cronjob.service';
import { AvailableCapacityNegotiationService } from './application/available-capacity/available-capacity-negotiation.service';
import { ChargingStationService } from './application/charging-station/charging-station.service';
import { AvailableCapacityNegotiationEntity } from './adapter/out/entities/available-capacity-negotiation.entity';
import { AvailableCapacityNegotiationDetailEntity } from './adapter/out/entities/available-capacity-negotiation-detail.entity';
import { ChargingStationEntity } from './adapter/out/entities/charging-station.entity';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MqTopicPublishHelper } from './adapter/out/mq/mq-topic-publish-helper';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    MikroOrmModule.forFeature([
      ChargingStationEntity,
      AvailableCapacityNegotiationEntity,
      AvailableCapacityNegotiationDetailEntity,
    ]),
  ],
  controllers: [OscpController],
  providers: [
    AvailableCapacityNegotiationCronjobService,
    AvailableCapacityNegotiationService,
    ChargingStationService,
    MqTopicPublishHelper,
  ],
})
export class ElmoModule {}
