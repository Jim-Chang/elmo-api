import { Factory } from '@mikro-orm/seeder';
import { FeederEntity } from '../../elmo/adapter/out/entities/feeder.entity';
import { faker } from '@faker-js/faker';
import { LOAD_SITE_UID_LIST } from './load-site.factory';
import { TRANSFORMER_UID_MAP } from './transformer.factory';

export const FEEDERS = ['SV61', 'UL15', 'WF37', 'B526'];
export const FEEDER_TREE = [
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
  {
    name: 'W360',
    loadSites: [
      {
        uid: LOAD_SITE_UID_LIST.W360[0],
        transformer: {
          uid: TRANSFORMER_UID_MAP.W360[0],
        },
      },
    ],
  },
];
export class FeederFactory extends Factory<FeederEntity> {
  model = FeederEntity;
  definition() {
    return {
      name: faker.helpers.arrayElement(FEEDERS),
    };
  }
}
