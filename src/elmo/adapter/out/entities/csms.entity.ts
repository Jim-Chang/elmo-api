import {
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { ChargingStationEntity } from './charging-station.entity';

@Entity({ tableName: 'csms' })
export class CsmsEntity {
  @PrimaryKey()
  id!: number;

  @Property()
  name!: string;

  @Property({ nullable: true })
  oscpBaseUrl?: string;

  @Property({ nullable: true })
  oscpEndpoint?: string;

  @Property({ nullable: true, length: 1024 })
  oscpToken?: string;

  // 已完成 OSCP Register 與 Handshake
  @Property({ default: false })
  isConnected!: boolean;

  @OneToMany({
    entity: () => ChargingStationEntity,
    mappedBy: 'csms',
  })
  chargingStations = new Collection<ChargingStationEntity>(this);
}
