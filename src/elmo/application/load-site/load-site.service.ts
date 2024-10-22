import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { LoadSiteEntity } from '../../adapter/out/entities/load-site.entity';

@Injectable()
export class LoadSiteService {
  constructor(
    @InjectRepository(LoadSiteEntity)
    private readonly loadSiteRepository: EntityRepository<LoadSiteEntity>,
  ) {}

  async getAllLoadSites(): Promise<LoadSiteEntity[]> {
    return await this.loadSiteRepository.findAll();
  }

  async findLoadSiteWithChargeStationAndTransformer(filterBy: {
    districtId?: number;
    feedLineId?: number;
    keyword?: string;
  }): Promise<LoadSiteEntity[]> {
    const { districtId, feedLineId, keyword } = filterBy;

    // filter load sites by district, feed line, keyword
    let loadSiteFilters: any = {};

    if (districtId) {
      loadSiteFilters.feedLine = {
        district: { id: districtId },
      };
    }

    if (feedLineId) {
      loadSiteFilters.feedLine = {
        ...loadSiteFilters.feedLine,
        id: feedLineId,
      };
    }

    if (keyword) {
      loadSiteFilters = {
        ...loadSiteFilters,
        ...{ name: { $like: `%${keyword}%` } },
      };
    }

    return await this.loadSiteRepository.find(loadSiteFilters, {
      populate: ['chargingStations', 'feedLine', 'transformers'],
    });
  }
}
