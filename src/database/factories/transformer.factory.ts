import { Factory } from '@mikro-orm/seeder';
import { TransformerEntity } from '../../elmo/adapter/out/entities/transformer.entity';
import { faker } from '@faker-js/faker';

export const TRANSFORMER_UID_MAP = {
  SV61: ['B6734_AE0100_J24_T02', 'B6734_AE0100_F01'], // NOTE: [低壓變壓器, 高供用戶]
  UL15: ['ML_ELMO_GW01'],
  WF37: ['NTP_ELMO_DK1000_01'],
  B526: ['Q1907_CC4701_V27261x13_V17651x3'],
  W360: ['B5739_GB2822_T01_3'],
};
export class TransformerFactory extends Factory<TransformerEntity> {
  model = TransformerEntity;
  definition() {
    return {
      uid: faker.string.uuid(),
      name: faker.lorem.word(),
      capacity: faker.number.int({ min: 1000, max: 3000 }),
      voltageLevel: faker.number.int({ min: 22800, max: 22800 }),
      tpclid: faker.string.uuid(),
      group: faker.lorem.word(),
    };
  }
}
