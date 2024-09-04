import { Module } from '@nestjs/common';
import { OscpController } from './oscp.controller';

@Module({
  controllers: [OscpController],
})
export class OscpModule {}
