import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { DistrictSeeder } from './district.seeder';
import { FeederSeeder } from './feeder.seeder';
import { LoadSiteSeeder } from './load-site.seeder';
import { TransformerSeeder } from './transformer.seeder';
import { ChargingStationSeeder } from './charging-station.seeder';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    return this.call(em, [
      DistrictSeeder,
      FeederSeeder,
      LoadSiteSeeder,
      TransformerSeeder,
      ChargingStationSeeder,
    ]);
  }
}
