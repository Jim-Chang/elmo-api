import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { LoadSiteFactory } from '../factories/load-site.factory';
import { ChargingStationFactory } from '../factories/charging-station.factory';
import { DistrictFactory } from '../factories/district.factory';
import { FEEDER_TREE, FeederFactory } from '../factories/feeder.factory';
import { TransformerFactory } from '../factories/transformer.factory';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.createDistricts(em);
  }

  /**
   * NOTE: 除建立 districts 外，
   * 還會建立 feeders、loadSites、transformers、chargingStations 等表
   */
  private async createDistricts(em: EntityManager) {
    const allEntities = [];

    for (const feederData of FEEDER_TREE) {
      const district = new DistrictFactory(em).makeOne();

      const feeder = new FeederFactory(em).makeOne({
        name: feederData.name,
        district: district,
      });

      for (const loadSiteData of feederData.loadSites) {
        const loadSite = new LoadSiteFactory(em).makeOne({
          uid: loadSiteData.uid,
          feeder: feeder,
        });

        const transformer = new TransformerFactory(em).makeOne({
          uid: loadSiteData.transformer.uid,
          loadSite: loadSite,
        });

        const chargingStation = new ChargingStationFactory(em).makeOne({
          district: district,
          feeder: feeder,
          loadSite: loadSite,
          csms: null,
        });

        allEntities.push(
          district,
          feeder,
          loadSite,
          transformer,
          chargingStation,
        );
      }
    }

    await em.persistAndFlush(allEntities);
  }
}
