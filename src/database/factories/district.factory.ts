import { Factory } from '@mikro-orm/seeder';
import { DistrictEntity } from '../../elmo/adapter/out/entities/district.entity';
import { faker } from '@faker-js/faker';

export class DistrictFactory extends Factory<DistrictEntity> {
  model = DistrictEntity;
  definition() {
    return {
      name: faker.lorem.word(),
      code: faker.string.uuid(),
    };
  }
}
