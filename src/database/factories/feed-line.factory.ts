import { Factory } from '@mikro-orm/seeder';
import { FeedLineEntity } from '../../elmo/adapter/out/entities/feed-line.entity';
import { faker } from '@faker-js/faker';

export class FeedLineFactory extends Factory<FeedLineEntity> {
  model = FeedLineEntity;
  definition() {
    return {
      name: faker.helpers.arrayElement(['SV61', 'UL15', 'WF37', 'B526']),
    };
  }
}
