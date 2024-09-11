import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'charging_stations' })
export class ChargingStationEntity {
  @PrimaryKey()
  id: number;

  @Property({ unique: true })
  uid: string;

  @Property()
  name: string;
}
