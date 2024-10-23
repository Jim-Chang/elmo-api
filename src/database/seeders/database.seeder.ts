import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { LoadSiteFactory } from '../factories/load-site.factory';
import { ChargingStationFactory } from '../factories/charging-station.factory';
import { DistrictFactory } from '../factories/district.factory';
import { FeedLineFactory } from '../factories/feed-line.factory';
import { TransformerFactory } from '../factories/transformer.factory';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.createDistricts(em);
  }

  /**
   * NOTE: 除建立 districts 外，
   * 還會建立 feedLines、loadSites、transformers、chargingStations 等表
   */
  private async createDistricts(em: EntityManager) {
    // in-degree 0 entities
    const districts = new DistrictFactory(em).make(3);

    const allEntities = [];

    districts.forEach((district) => {
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
        .make(1);

      const chargingStations = new ChargingStationFactory(em)
        .each((chargingStation) => {
          chargingStation.district = district;
          chargingStation.feedLine = feedLine;
          chargingStation.loadSite = loadSite;
          chargingStation.csms = null;
        })
        .make(1);

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
