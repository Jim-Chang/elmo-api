import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { HTTP_TIMEOUT_MILLISECONDS } from '../constants';
import { OscpController } from './adapter/in/oscp/oscp.controller';
import { OscpHeadersValidationMiddleware } from '../middleware/oscp-header-validation.middleware';
import { AvailableCapacityNegotiationCronjobService } from './adapter/in/cronjob/available-capacity-negotiation.cronjob.service';
import { AvailableCapacityNegotiationService } from './application/available-capacity/available-capacity-negotiation.service';
import { ChargingStationService } from './application/charging-station/charging-station.service';
import { AvailableCapacityEmergencyEntity } from './adapter/out/entities/available-capacity-emergency.entity';
import { AvailableCapacityNegotiationEntity } from './adapter/out/entities/available-capacity-negotiation.entity';
import { AvailableCapacityNegotiationDetailEntity } from './adapter/out/entities/available-capacity-negotiation-detail.entity';
import { ChargingStationEntity } from './adapter/out/entities/charging-station.entity';
import { CsmsOscpRequestHelper } from './adapter/out/csms-oscp/csms-oscp-request-helper';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MqTopicPublishHelper } from './adapter/out/mq/mq-topic-publish-helper';
import { ProxyHelper } from './adapter/out/proxy/proxy-helper';
import { ConfigModule } from '@nestjs/config';
import { ChargingStationNegotiationController } from './adapter/in/api/charging-station-negotiation.controller';
import { FeedLineEntity } from './adapter/out/entities/feed-line.entity';
import { LoadSiteEntity } from './adapter/out/entities/load-site.entity';
import { FeedLineService } from './application/feed-line/feed-line.service';
import { FilterOptionsController } from './adapter/in/api/filter-options.controller';
import { DistrictEntity } from './adapter/out/entities/district.entity';
import { DistrictService } from './application/district/district.service';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: HTTP_TIMEOUT_MILLISECONDS,
    }),
    MikroOrmModule.forFeature([
      ChargingStationEntity,
      AvailableCapacityEmergencyEntity,
      AvailableCapacityNegotiationEntity,
      AvailableCapacityNegotiationDetailEntity,
      FeedLineEntity,
      LoadSiteEntity,
      DistrictEntity,
    ]),
  ],
  controllers: [
    OscpController,
    ChargingStationNegotiationController,
    FilterOptionsController,
  ],
  providers: [
    AvailableCapacityNegotiationCronjobService,
    AvailableCapacityNegotiationService,
    ChargingStationService,
    CsmsOscpRequestHelper,
    MqTopicPublishHelper,
    ProxyHelper,
    FeedLineService,
    DistrictService,
  ],
})
export class ElmoModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(OscpHeadersValidationMiddleware).forRoutes(OscpController);
  }
}
