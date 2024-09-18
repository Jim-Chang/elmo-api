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

  @OneToOne(() => AvailableCapacityNegotiationDetailEntity, {
    owner: true,
    nullable: true,
  })
  applyDetail?: AvailableCapacityNegotiationDetailEntity;

  // cache status of last AvailableCapacityNegotiationDetail
  @Property({ nullable: false, default: NegotiationStatus.INITIAL_EDIT })
  lastDetailStatus!: NegotiationStatus;
}
