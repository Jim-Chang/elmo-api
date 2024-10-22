import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { LoadSiteFactory } from '../factories/load-site.factory';
import { ChargingStationFactory } from '../factories/charging-station.factory';
import { DistrictFactory } from '../factories/district.factory';
import { FeedLineFactory } from '../factories/feed-line.factory';
import { CsmsFactory } from '../factories/csms.factory';
import { TransformerFactory } from '../factories/transformer.factory';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.createChargingStations(em);
  }

  private async createChargingStations(em: EntityManager) {
    // in-degree 0 entities
    const districts = new DistrictFactory(em).make(3);
    const csmsSystems = new CsmsFactory(em).make(3);

    const allEntities = [];

    districts.forEach((district, index) => {
      const feedLine = new FeedLineFactory(em).makeOne({
        district: district,
      });

      const loadSite = new LoadSiteFactory(em).makeOne({
        feedLine: feedLine,
      });

      const transformers = new TransformerFactory(em)
        .each((transformer) => {
          transformer.loadSite = loadSite;
        })
        .make(2); // create 2 transformers for each loadSite

      const chargingStations = new ChargingStationFactory(em)
        .each((chargingStation) => {
          chargingStation.district = district;
          chargingStation.feedLine = feedLine;
          chargingStation.loadSite = loadSite;
          chargingStation.csms = csmsSystems[index % csmsSystems.length];
        })
        .make(3); // create 3 charging stations for each loadSite

      allEntities.push(
        feedLine,
        loadSite,
        ...transformers,
        ...chargingStations,
      );
    });

    await em.persistAndFlush(allEntities);
  }
}
