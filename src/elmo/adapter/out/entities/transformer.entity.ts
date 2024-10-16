import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { LoadSiteEntity } from './load-site.entity';

@Entity({ tableName: 'transformers' })
export class TransformerEntity {
  @PrimaryKey()
  id: number;

  @Property()
  name: string;

  // to parent LoadSiteEntity
  @ManyToOne(() => LoadSiteEntity, {
    nullable: true,
    deleteRule: 'set null',
  })
  loadSite?: LoadSiteEntity;
}
