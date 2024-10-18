import {
  Cascade,
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { ChargingStationEntity } from './charging-station.entity';
import { FeedLineEntity } from './feed-line.entity';

@Entity({ tableName: 'districts' })
export class DistrictEntity {
  @PrimaryKey()
  id: number;

  @Property()
  name: string;

  // to child FeedLineEntity
  @OneToMany({
    entity: () => FeedLineEntity,
    mappedBy: 'district',
    cascade: [Cascade.ALL],
  })
  feedLines = new Collection<FeedLineEntity>(this);

  // to child ChargingStationEntity
  @OneToMany({
    entity: () => ChargingStationEntity,
    mappedBy: 'district',
    cascade: [Cascade.ALL],
  })
  chargingStations = new Collection<ChargingStationEntity>(this);
}
