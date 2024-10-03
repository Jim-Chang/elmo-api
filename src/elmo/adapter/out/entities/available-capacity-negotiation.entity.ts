import {
  Cascade,
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { TimestampBaseEntity } from './timestamp-base.entity';
import { AvailableCapacityNegotiationDetailEntity } from './available-capacity-negotiation-detail.entity';
import { ChargingStationEntity } from './charging-station.entity';
import { NegotiationStatus } from '../../../application/available-capacity/types';
import { AvailableCapacityEmergencyEntity } from './available-capacity-emergency.entity';

@Entity({ tableName: 'available_capacity_negotiations' })
export class AvailableCapacityNegotiationEntity extends TimestampBaseEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  date!: Date;

  @ManyToOne(() => ChargingStationEntity, {
    nullable: false,
  })
  chargingStation!: ChargingStationEntity;

  @OneToMany({
    entity: () => AvailableCapacityNegotiationDetailEntity,
    mappedBy: 'negotiation',
    cascade: [Cascade.ALL],
  })
  details = new Collection<AvailableCapacityNegotiationDetailEntity>(this);

  // 最終協商可用容量的 detail
  @OneToOne(() => AvailableCapacityNegotiationDetailEntity, {
    owner: true,
    nullable: true,
  })
  applyDetail?: AvailableCapacityNegotiationDetailEntity;

  // cache status of last AvailableCapacityNegotiationDetail
  @Property({ nullable: false, default: NegotiationStatus.INITIAL_EDIT })
  lastDetailStatus!: NegotiationStatus;

  @OneToMany({
    entity: () => AvailableCapacityEmergencyEntity,
    mappedBy: 'negotiation',
    cascade: [Cascade.ALL],
  })
  emergencies = new Collection<AvailableCapacityEmergencyEntity>(this);

  @OneToOne(() => AvailableCapacityEmergencyEntity, {
    owner: true,
    nullable: true,
  })
  lastEmergency: AvailableCapacityEmergencyEntity;
}
