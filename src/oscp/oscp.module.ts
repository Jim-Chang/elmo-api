import { Module } from '@nestjs/common';
import { OscpController } from './adapter/in/oscp.controller';
import { ChargingStationEntity } from './adapter/out/entities/charging-station.entity';
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
  imports: [MikroOrmModule.forFeature([ChargingStationEntity])],
  controllers: [OscpController],
})
export class OscpModule {}
