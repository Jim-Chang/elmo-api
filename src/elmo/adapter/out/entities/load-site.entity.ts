import {
  Cascade,
  Collection,
  Entity,
  Enum,
  ManyToOne,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { LoadSiteCategory } from '../../../application/load-site/types';
import { ChargingStationEntity } from './charging-station.entity';
import { TransformerEntity } from './transformer.entity';
import { FeederEntity } from './feeder.entity';

@Entity({ tableName: 'load_sites' })
export class LoadSiteEntity {
  @PrimaryKey()
  id: number;

  @Property()
  uid: string;

  @Property()
  name: string;

  @Enum(() => LoadSiteCategory)
  category: LoadSiteCategory;

  @Property({ nullable: true })
  address?: string;

  // to parent FeederEntity
  @ManyToOne(() => FeederEntity, {
    nullable: true,
    deleteRule: 'set null',
  })
  feeder?: FeederEntity;

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
