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
import { AvailableCapacityEmergencyEntity } from './available-capacity-emergency.entity';
import { AvailableCapacityNegotiationEntity } from './available-capacity-negotiation.entity';
import { CsmsEntity } from './csms.entity';
import { LoadSiteEntity } from './load-site.entity';
import { FeederEntity } from './feeder.entity';
import { DistrictEntity } from './district.entity';

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

  @Property({ nullable: true })
  electricityAccountNo?: string;

  @OneToMany({
    entity: () => AvailableCapacityNegotiationEntity,
    mappedBy: 'chargingStation',
    cascade: [Cascade.ALL],
  })
  negotiations = new Collection<AvailableCapacityNegotiationEntity>(this);

  @OneToMany({
    entity: () => AvailableCapacityEmergencyEntity,
    mappedBy: 'chargingStation',
    cascade: [Cascade.ALL],
  })
  emergencies = new Collection<AvailableCapacityEmergencyEntity>(this);

  @ManyToOne(() => CsmsEntity, {
    nullable: true,
    deleteRule: 'set null',
  })
  csms?: CsmsEntity;

  @ManyToOne(() => LoadSiteEntity, {
    nullable: true,
    deleteRule: 'set null',
  })
  loadSite?: LoadSiteEntity;

  @ManyToOne(() => FeederEntity, {
    nullable: true,
    deleteRule: 'set null',
  })
  feedLine?: FeederEntity;

  @ManyToOne(() => DistrictEntity, {
    nullable: true,
    deleteRule: 'set null',
  })
  district?: DistrictEntity;
}
