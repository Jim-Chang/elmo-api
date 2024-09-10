import { Module } from '@nestjs/common';
import { OscpController } from './adapter/in/oscp.controller';

@Module({
  controllers: [OscpController],
})
export class OscpModule {}
