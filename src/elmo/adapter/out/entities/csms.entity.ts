import {
  Collection,
  Entity,
  Index,
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

  // Token required when elmo (we) communicates with csms
  @Index()
  @Property({ nullable: true, length: 767, unique: true })
  oscpCsmsToken?: string;

  // Token required when csms communicates with elmo (us)
  @Index()
  @Property({ nullable: true, length: 767, unique: true })
  oscpElmoToken?: string;

  // 已完成 OSCP Register 與 Handshake
  @Property({ default: false })
  isConnected!: boolean;

  @OneToMany({
    entity: () => ChargingStationEntity,
    mappedBy: 'csms',
  })
  chargingStations = new Collection<ChargingStationEntity>(this);
}
