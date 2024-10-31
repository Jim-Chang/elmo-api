import { faker } from '@faker-js/faker';
import { Factory } from '@mikro-orm/seeder';
import { LoadSiteEntity } from '../../elmo/adapter/out/entities/load-site.entity';
import { LoadSiteCategory } from '../../elmo/application/load-site/types';

export const LOAD_SITE_UID_LIST = {
  SV61: ['TPD102_B2', 'TPD102_B1'],
  UL15: ['ML_B1'],
  WF37: ['NTP_01'],
  B526: ['KA0101_01'],
};
export class LoadSiteFactory extends Factory<LoadSiteEntity> {
  model = LoadSiteEntity;
  definition() {
    return {
      name: faker.lorem.word(),
      category: LoadSiteCategory.HiCustomer,
    };
  }
}
