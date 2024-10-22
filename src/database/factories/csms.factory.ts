import { Factory } from '@mikro-orm/seeder';
import { CsmsEntity } from '../../elmo/adapter/out/entities/csms.entity';
import { faker } from '@faker-js/faker';

export class CsmsFactory extends Factory<CsmsEntity> {
  model = CsmsEntity;
  definition() {
    return {
      name: faker.lorem.word(),
      oscpBaseUrl: faker.internet.url(),
      oscpCsmsToken: faker.string.uuid(),
      oscpElmoToken: faker.string.uuid(),
      isSentHandshake: faker.datatype.boolean(),
      isConnected: faker.datatype.boolean(),
    };
  }
}
