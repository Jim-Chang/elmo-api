import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { LoadSiteFactory } from '../factories/load-site.factory';
import { ChargingStationFactory } from '../factories/charging-station.factory';
import { DistrictFactory } from '../factories/district.factory';
import {
  FEED_LINE_TREE,
  FeedLineFactory,
} from '../factories/feed-line.factory';
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
    const allEntities = [];

    for (const feedLineData of FEED_LINE_TREE) {
      const district = new DistrictFactory(em).makeOne();

      const feedLine = new FeedLineFactory(em).makeOne({
        name: feedLineData.name,
        district: district,
      });

      for (const loadSiteData of feedLineData.loadSites) {
        const loadSite = new LoadSiteFactory(em).makeOne({
          uid: loadSiteData.uid,
          feedLine: feedLine,
        });

        const transformer = new TransformerFactory(em).makeOne({
          uid: loadSiteData.transformer.uid,
          loadSite: loadSite,
        });

        const chargingStation = new ChargingStationFactory(em).makeOne({
          district: district,
          feedLine: feedLine,
          loadSite: loadSite,
          csms: null,
        });

        allEntities.push(
          district,
          feedLine,
          loadSite,
          transformer,
          chargingStation,
        );
      }
    }

    await em.persistAndFlush(allEntities);
  }
}
