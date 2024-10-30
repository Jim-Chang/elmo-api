import { Factory } from '@mikro-orm/seeder';
import { FeedLineEntity } from '../../elmo/adapter/out/entities/feed-line.entity';
import { faker } from '@faker-js/faker';
import { LOAD_SITE_UID_LIST } from './load-site.factory';
import { TRANSFORMER_UID_MAP } from './transformer.factory';

export const FEED_LINES = ['SV61', 'UL15', 'WF37', 'B526'];
export const FEED_LINE_TREE = [
  {
    name: 'SV61',
    loadSites: [
      {
        uid: LOAD_SITE_UID_LIST.SV61[0],
        transformer: {
          uid: TRANSFORMER_UID_MAP.SV61[0],
        },
      },
      {
        uid: LOAD_SITE_UID_LIST.SV61[1],
        transformer: {
          uid: TRANSFORMER_UID_MAP.SV61[1],
        },
      },
    ],
  },
  {
    name: 'UL15',
    loadSites: [
      {
        uid: LOAD_SITE_UID_LIST.UL15[0],
        transformer: {
          uid: TRANSFORMER_UID_MAP.UL15[0],
        },
      },
    ],
  },
];
export class FeedLineFactory extends Factory<FeedLineEntity> {
  model = FeedLineEntity;
  definition() {
    return {
      name: faker.helpers.arrayElement(FEED_LINES),
    };
  }
}
