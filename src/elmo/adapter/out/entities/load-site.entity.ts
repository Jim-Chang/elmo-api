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
import { TransformerEntity } from './transformer.entity';
import { FeedLineEntity } from './feed-line.entity';

@Entity({ tableName: 'load_sites' })
export class LoadSiteEntity {
  @PrimaryKey()
  id: number;

  @Property()
  name: string;

  @Property({ nullable: true })
  address?: string;

  // to parent FeedLineEntity
  @ManyToOne(() => FeedLineEntity, {
    nullable: true,
    deleteRule: 'set null',
  })
  feedLine?: FeedLineEntity;

  // to child ChargingStationEntity
  @OneToMany({
    entity: () => ChargingStationEntity,
    mappedBy: 'loadSite',
    cascade: [Cascade.ALL],
  })
  chargingStations = new Collection<ChargingStationEntity>(this);

  // to child TransformerEntity
  @OneToMany({
    entity: () => TransformerEntity,
    mappedBy: 'loadSite',
    cascade: [Cascade.ALL],
  })
  transformers = new Collection<TransformerEntity>(this);
}
