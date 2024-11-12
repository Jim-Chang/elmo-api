import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { LoadSiteFactory } from '../factories/load-site.factory';
import { LoadSiteSeed } from './load-site-seed';

export class LoadSiteSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const factory = new LoadSiteFactory(em);
    const entities = LoadSiteSeed.map((data) => factory.makeOne(data));
    return await em.persistAndFlush(entities);
  }
}
