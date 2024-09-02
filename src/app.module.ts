import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getEnvPath } from './config/utils';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: getEnvPath(),
      load: [],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
