import {
  Cascade,
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
  types,
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

  // 已完成 OSCP Register 與 Handshake
  @Property({ default: false })
  isConnected: boolean;

  // 契約容量 (kW)
  @Property({ type: types.float, default: 0 })
  contractCapacity: number;

  @OneToMany({
    entity: () => AvailableCapacityNegotiationEntity,
    mappedBy: 'chargingStation',
    cascade: [Cascade.ALL],
  })
  availableCapacityNegotiations =
    new Collection<AvailableCapacityNegotiationEntity>(this);
}
