import { Factory } from '@mikro-orm/seeder';
import { FeedLineEntity } from '../../elmo/adapter/out/entities/feed-line.entity';
import { faker } from '@faker-js/faker';

const FEED_LINES = ['SV61', 'UL15', 'WF37', 'B526'];
export class FeedLineFactory extends Factory<FeedLineEntity> {
  model = FeedLineEntity;
  definition() {
    return {
      name: faker.helpers.arrayElement(FEED_LINES),
    };
  }
}
