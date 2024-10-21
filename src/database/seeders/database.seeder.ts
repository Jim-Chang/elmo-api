import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { TransformerEntity } from '../../elmo/adapter/out/entities/transformer.entity';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    // will get persisted automatically
    const transformer = em.create(TransformerEntity, {
      name: 'Test Transformer',
    });
    await em.persistAndFlush(transformer);
  }
}
