import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { TransformerFactory } from '../factories/transformer.factory';
import { TransformerSeed } from './transformer-seed';

export class TransformerSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const factory = new TransformerFactory(em);
    const entities = TransformerSeed.map((data) => factory.makeOne(data));
    return await em.persistAndFlush(entities);
  }
}
