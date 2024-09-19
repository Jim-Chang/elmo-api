import {
  Cascade,
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { AvailableCapacityNegotiationEntity } from './available-capacity-negotiation.entity';

@Entity({ tableName: 'charging_stations' })
export class ChargingStationEntity {
  @PrimaryKey()
  id: number;

  @Property({ unique: true })
  uid: string;

  @Property()
  name: string;

  @OneToMany({
    entity: () => AvailableCapacityNegotiationEntity,
    mappedBy: 'chargingStation',
    cascade: [Cascade.ALL],
  })
  availableCapacityNegotiations =
    new Collection<AvailableCapacityNegotiationEntity>(this);
}
