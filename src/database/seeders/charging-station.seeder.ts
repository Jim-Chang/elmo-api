import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { ChargingStationFactory } from '../factories/charging-station.factory';
import { ChargingStationSeed } from './charging-station-seed';

export class ChargingStationSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const factory = new ChargingStationFactory(em);
    const entities = ChargingStationSeed.map((data) => factory.makeOne(data));
    return await em.persistAndFlush(entities);
  }
}
