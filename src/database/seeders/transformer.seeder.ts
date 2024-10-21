import { EntityManager } from '@mikro-orm/mysql';
import { Seeder } from '@mikro-orm/seeder';
import { TransformerEntity } from '../../elmo/adapter/out/entities/transformer.entity';

export class TransformerSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const transformer = em.create(TransformerEntity, {
      name: 'Test Transformer',
    });
    await em.persistAndFlush(transformer);
  }
}
