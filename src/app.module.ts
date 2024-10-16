import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getEnvPath } from './config/utils';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ElmoModule } from './elmo/elmo.module';
import { mikroOrmConfig } from './config/mikro-orm.config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { mqConfig } from './config/mq.config';
import { ScheduleModule } from '@nestjs/schedule';
import { proxyConfig } from './config/proxy.config';
import { redisConfig } from './config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: getEnvPath(),
      load: [mqConfig, proxyConfig, redisConfig],
    }),
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule.forFeature(mikroOrmConfig)],
      inject: [mikroOrmConfig.KEY],
      useFactory: (config) => config,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: true,
          },
        },
        customProps: (req, res) => ({
          context: 'HTTP',
        }),
        serializers: {
          req: (req) => ({
            url: req.url,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),
    ScheduleModule.forRoot(),
    ElmoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
