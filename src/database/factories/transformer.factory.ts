import { Factory } from '@mikro-orm/seeder';
import { TransformerEntity } from '../../elmo/adapter/out/entities/transformer.entity';
import { faker } from '@faker-js/faker';

export class TransformerFactory extends Factory<TransformerEntity> {
  model = TransformerEntity;
  definition() {
    return {
      uid: faker.string.uuid(),
      name: faker.lorem.word(),
      capacity: faker.number.int({ min: 1000, max: 3000 }),
      voltageLevel: faker.number.int({ min: 22800, max: 22800 }),
      tpclid: faker.string.uuid(),
      group: faker.lorem.word(),
    };
  }
}
