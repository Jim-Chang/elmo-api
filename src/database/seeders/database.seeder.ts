import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { TransformerFactory } from '../factories/transformer.factory';
import { LoadSiteFactory } from '../factories/load-site.factory';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.createTransformers(em);
  }
  private async createTransformers(em: EntityManager) {
    const transformers = new TransformerFactory(em)
      .each((transformer) => {
        transformer.loadSite = new LoadSiteFactory(em).makeOne();
      })
      .make(10);
    await em.persistAndFlush(transformers);
  }
}
