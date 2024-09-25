import {
  Cascade,
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { ChargingStationEntity } from './charging-station.entity';

@Entity({ tableName: 'feed_lines' })
export class FeedLineEntity {
  @PrimaryKey()
  id: number;

  @Property()
  name: string;

  @OneToMany({
    entity: () => ChargingStationEntity,
    mappedBy: 'feedLine',
    cascade: [Cascade.ALL],
  })
  chargingStations = new Collection<ChargingStationEntity>(this);
}
