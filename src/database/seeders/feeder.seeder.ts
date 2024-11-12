import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { FeederFactory } from '../factories/feeder.factory';
import { FeederSeed } from './feeder-seed';

export class FeederSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const factory = new FeederFactory(em);
    const entities = FeederSeed.map((data) => factory.makeOne(data));
    return await em.persistAndFlush(entities);
  }
}
