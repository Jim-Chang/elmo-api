import {
  Cascade,
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
  types,
} from '@mikro-orm/core';
import { AvailableCapacityNegotiationEntity } from './available-capacity-negotiation.entity';
import { CsmsEntity } from './csms.entity';

@Entity({ tableName: 'charging_stations' })
export class ChargingStationEntity {
  @PrimaryKey()
  id: number;

  @Property({ unique: true })
  uid: string;

  @Property()
  name: string;

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

  @ManyToOne(() => CsmsEntity, {
    nullable: true,
    deleteRule: 'set null',
  })
  csms: CsmsEntity;
}
