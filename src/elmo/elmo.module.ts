import { RedisModule, RedisModuleOptions } from '@liaoliaots/nestjs-redis';
import { HttpModule } from '@nestjs/axios';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { HTTP_TIMEOUT_MILLISECONDS } from '../constants';
import { OscpController } from './adapter/in/oscp/oscp.controller';
import { OscpHeadersValidationMiddleware } from './adapter/in/middleware/oscp-header-validation.middleware';
import { AvailableCapacityEmergencyService } from './application/available-capacity/available-capacity-emergency.service';
import { AvailableCapacityNegotiationCronjobService } from './adapter/in/cronjob/available-capacity-negotiation.cronjob.service';
import { AvailableCapacityNegotiationService } from './application/available-capacity/available-capacity-negotiation.service';
import { ChargingStationService } from './application/charging-station/charging-station.service';
import { RealTimeDataService } from './application/real-time-data/real-time-data.service';
import { AvailableCapacityService } from './application/available-capacity/available-capacity.service';
import { AvailableCapacityEmergencyEntity } from './adapter/out/entities/available-capacity-emergency.entity';
import { AvailableCapacityNegotiationEntity } from './adapter/out/entities/available-capacity-negotiation.entity';
import { AvailableCapacityNegotiationDetailEntity } from './adapter/out/entities/available-capacity-negotiation-detail.entity';
import { ChargingStationEntity } from './adapter/out/entities/charging-station.entity';
import { CsmsOscpRequestHelper } from './adapter/out/csms-oscp/csms-oscp-request-helper';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MqTopicPublishHelper } from './adapter/out/mq/mq-topic-publish-helper';
import { ProxyHelper } from './adapter/out/proxy/proxy-helper';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisConfig } from '../config/redis.config';
import { RedisHelper } from './adapter/out/redis/redis-helper';
import { ChargingStationEmergencyController } from './adapter/in/api/charging-station-emergency.controller';
import { InternalApiController } from './adapter/in/internal-api/internal-api.controller';
import { ChargingStationNegotiationController } from './adapter/in/api/charging-station-negotiation.controller';
import { RealTimeDataController } from './adapter/in/api/real-time-data.controller';
import { FeedLineEntity } from './adapter/out/entities/feed-line.entity';
import { LoadSiteEntity } from './adapter/out/entities/load-site.entity';
import { FeedLineService } from './application/feed-line/feed-line.service';
import { FilterOptionsController } from './adapter/in/api/filter-options.controller';
import { DistrictEntity } from './adapter/out/entities/district.entity';
import { InternalNegotiationHelper } from './adapter/in/internal-api/internal-negotiation-helper';
import { DistrictService } from './application/district/district.service';
import { CsmsService } from './application/csms/csms.service';
import { CsmsEntity } from './adapter/out/entities/csms.entity';
import { TransformerEntity } from './adapter/out/entities/transformer.entity';
import { UserEntity } from './adapter/out/entities/user.entity';
import { TransformerService } from './application/transformer/transformer.service';
import { LoadSiteService } from './application/load-site/load-site.service';
import { TreeGeneratorService } from './application/tree/tree-generator.service';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ElasticsearchConfig } from '../config/es.config';
import { TransformerController } from './adapter/in/api/transformer.controller';
import { TransformerHistoryDataService } from './application/history-data/transformer-history-data-service/transformer-history-data.service';
import { ChargingStationController } from './adapter/in/api/charging-station.controller';
import { ChargingStationHistoryDataService } from './application/history-data/charging-station-history-data-service/charging-station-history-data.service';
import { LoadSiteController } from './adapter/in/api/load-site.controller';
import { UserController } from './adapter/in/api/user.controller';
import { UserService } from './application/user/user.service';

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
      TransformerEntity,
      CsmsEntity,
      UserEntity,
    ]),
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const esConfig =
          configService.get<ElasticsearchConfig>('elasticsearch');
        return {
          node: `http://${esConfig.host}:${esConfig.port}`,
          auth: {
            username: esConfig.user,
            password: esConfig.password,
          },
        };
      },
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): RedisModuleOptions => {
        const redisConfig = configService.get<RedisConfig>('redis');
        return {
          config: {
            url: redisConfig.url,
          },
        };
      },
    }),
  ],
  controllers: [
    ChargingStationEmergencyController,
    ChargingStationNegotiationController,
    FilterOptionsController,
    InternalApiController,
    LoadSiteController,
    RealTimeDataController,
    OscpController,
    TransformerController,
    ChargingStationController,
    UserController,
  ],
  providers: [
    AvailableCapacityService,
    AvailableCapacityEmergencyService,
    AvailableCapacityNegotiationCronjobService,
    AvailableCapacityNegotiationService,
    ChargingStationService,
    RealTimeDataService,
    CsmsOscpRequestHelper,
    InternalNegotiationHelper,
    MqTopicPublishHelper,
    ProxyHelper,
    RedisHelper,
    FeedLineService,
    DistrictService,
    LoadSiteService,
    TransformerService,
    TransformerHistoryDataService,
    ChargingStationHistoryDataService,
    CsmsService,
    TreeGeneratorService,
    UserService,
  ],
})
export class ElmoModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(OscpHeadersValidationMiddleware).forRoutes(OscpController);
  }
}
