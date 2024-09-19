import {
  Embeddable,
  Embedded,
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { TimestampBaseEntity } from './timestamp-base.entity';
import { AvailableCapacityNegotiationEntity } from './available-capacity-negotiation.entity';
import { NegotiationStatus } from '../../../application/available-capacity/types';

@Embeddable()
export class AvailableCapacityNegotiationHourCapacity {
  @Property()
  hour!: number;

  @Property()
  capacity!: number;
}

@Entity({ tableName: 'available_capacity_negotiation_details' })
export class AvailableCapacityNegotiationDetailEntity extends TimestampBaseEntity {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => AvailableCapacityNegotiationEntity, {
    nullable: false,
  })
  negotiation!: AvailableCapacityNegotiationEntity;

  @Property()
  status!: NegotiationStatus;

  @Embedded(() => AvailableCapacityNegotiationHourCapacity, { array: true })
  hourCapacities: AvailableCapacityNegotiationHourCapacity[] = [];
}
