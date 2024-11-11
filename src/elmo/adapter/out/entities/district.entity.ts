import {
  Cascade,
  Collection,
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { ChargingStationEntity } from './charging-station.entity';
import { FeederEntity } from './feeder.entity';
import { UserEntity } from './user.entity';

@Entity({ tableName: 'districts' })
export class DistrictEntity {
  @PrimaryKey()
  id: number;

  @Property()
  code: string; // 區碼

  @Property()
  name: string;

  @Property({ default: true })
  isActivated: boolean;

  // to child FeederEntity
  @OneToMany({
    entity: () => FeederEntity,
    mappedBy: 'district',
    cascade: [Cascade.ALL],
  })
  feedLines = new Collection<FeederEntity>(this);

  // to child ChargingStationEntity
  @OneToMany({
    entity: () => ChargingStationEntity,
    mappedBy: 'district',
    cascade: [Cascade.ALL],
  })
  chargingStations = new Collection<ChargingStationEntity>(this);

  // to child UserEntity
  @OneToMany({
    entity: () => UserEntity,
    mappedBy: 'district',
    cascade: [Cascade.ALL],
  })
  users = new Collection<UserEntity>(this);
}
