import {
  Cascade,
  Collection,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { ChargingStationEntity } from './charging-station.entity';
import { LoadSiteEntity } from './load-site.entity';
import { DistrictEntity } from './district.entity';

@Entity({ tableName: 'feeders' })
export class FeederEntity {
  @PrimaryKey()
  id: number;

  @Property()
  name: string;

  // to parent DistrictEntity
  @ManyToOne(() => DistrictEntity, {
    nullable: true,
    deleteRule: 'set null',
  })
  district?: DistrictEntity;

  // to child LoadSiteEntity
  @OneToMany({
    entity: () => LoadSiteEntity,
    mappedBy: 'feedLine',
    cascade: [Cascade.ALL],
  })
  loadSites = new Collection<LoadSiteEntity>(this);

  // to child ChargingStationEntity
  @OneToMany({
    entity: () => ChargingStationEntity,
    mappedBy: 'feedLine',
    cascade: [Cascade.ALL],
  })
  chargingStations = new Collection<ChargingStationEntity>(this);
}
