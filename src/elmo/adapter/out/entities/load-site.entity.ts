import {
  Cascade,
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { ChargingStationEntity } from './charging-station.entity';

@Entity({ tableName: 'load_sites' })
export class LoadSiteEntity {
  @PrimaryKey()
  id: number;

  @Property()
  name: string;

  @OneToMany({
    entity: () => ChargingStationEntity,
    mappedBy: 'loadSite',
    cascade: [Cascade.ALL],
  })
  chargingStations = new Collection<ChargingStationEntity>(this);
}
