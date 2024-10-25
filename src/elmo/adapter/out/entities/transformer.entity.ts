import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { LoadSiteEntity } from './load-site.entity';

@Entity({ tableName: 'transformers' })
export class TransformerEntity {
  @PrimaryKey()
  id: number;

  @Property()
  uid: string;

  @Property()
  tpclid: string; // 圖號座標 e.g. B6734AE01

  @Property()
  group: string; // 組別 e.g. TR1

  @Property()
  name: string;

  @Property()
  capacity: number; // 變壓器容量 (kVA) e.g. 3000

  @Property()
  voltageLevel: number; // 電壓別 (V) e.g. 22800

  // to parent LoadSiteEntity
  @ManyToOne(() => LoadSiteEntity, {
    nullable: true,
    deleteRule: 'set null',
  })
  loadSite?: LoadSiteEntity;
}
