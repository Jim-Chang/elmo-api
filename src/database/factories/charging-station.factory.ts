import { Factory } from '@mikro-orm/seeder';
import { ChargingStationEntity } from '../../elmo/adapter/out/entities/charging-station.entity';
import { faker } from '@faker-js/faker';

export class ChargingStationFactory extends Factory<ChargingStationEntity> {
  model = ChargingStationEntity;
  definition() {
    return {
      uid: faker.string.uuid(),
      name: faker.lorem.word(),
      contractCapacity: faker.number.int({ min: 1, max: 100 }),
      electricityAccountNo: faker.string.uuid(),
    };
  }
}
