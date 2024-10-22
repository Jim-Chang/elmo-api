import { Factory } from '@mikro-orm/seeder';
import { TransformerEntity } from '../../elmo/adapter/out/entities/transformer.entity';
import { faker } from '@faker-js/faker';

export class TransformerFactory extends Factory<TransformerEntity> {
  model = TransformerEntity;
  definition() {
    return {
      name: faker.lorem.word(),
    };
  }
}
