import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { DistrictFactory } from '../factories/district.factory';
import { DistrictSeed } from './district-seed';

export class DistrictSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const factory = new DistrictFactory(em);
    const entities = DistrictSeed.map((data) => factory.makeOne(data));
    await em.persistAndFlush(entities);
  }
}
