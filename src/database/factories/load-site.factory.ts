import { faker } from '@faker-js/faker';
import { Factory } from '@mikro-orm/seeder';
import { LoadSiteEntity } from '../../elmo/adapter/out/entities/load-site.entity';
import { LoadSiteCategory } from '../../elmo/application/load-site/types';

export class LoadSiteFactory extends Factory<LoadSiteEntity> {
  model = LoadSiteEntity;
  definition() {
    return {
      name: faker.lorem.word(),
      category: LoadSiteCategory.HiCustomer,
    };
  }
}
