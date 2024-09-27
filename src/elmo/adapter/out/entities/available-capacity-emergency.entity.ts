import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { ChargingStationEntity } from './charging-station.entity';
import { TimestampBaseEntity } from './timestamp-base.entity';

@Entity({ tableName: 'available_capacity_emergencies' })
export class AvailableCapacityEmergencyEntity extends TimestampBaseEntity {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => ChargingStationEntity, {
    nullable: false,
  })
  chargingStation!: ChargingStationEntity;

  // 開始時間
  @Property()
  periodStartAt!: Date;

  // 結束時間
  @Property()
  periodEndAt!: Date;

  // 可用容量 (kW)
  @Property()
  capacity!: number;

  // 是否成功發送 OSCP message 給充電站
  @Property({ default: false })
  isSuccessSent!: boolean;
}
