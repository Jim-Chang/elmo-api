import {
  Cascade,
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { ChargingStationEntity } from './charging-station.entity';

@Entity({ tableName: 'districts' })
export class DistrictEntity {
  @PrimaryKey()
  id: number;

  @Property()
  name: string;

  @OneToMany({
    entity: () => ChargingStationEntity,
    mappedBy: 'district',
    cascade: [Cascade.ALL],
  })
  chargingStations = new Collection<ChargingStationEntity>(this);
}
