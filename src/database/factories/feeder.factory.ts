import { Factory } from '@mikro-orm/seeder';
import { FeederEntity } from '../../elmo/adapter/out/entities/feeder.entity';
import { faker } from '@faker-js/faker';

export const FEEDERS = ['SV61', 'B526', 'WF37', 'UL15', 'W360'];

export class FeederFactory extends Factory<FeederEntity> {
  model = FeederEntity;
  definition() {
    return {
      name: faker.helpers.arrayElement(FEEDERS),
    };
  }
}
