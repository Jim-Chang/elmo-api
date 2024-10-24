import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/core';
import { LoadSiteUidMappingData } from './types';
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

  async getLoadSiteById(id: number): Promise<LoadSiteEntity> {
    return await this.loadSiteRepository.findOne(
      { id },
      {
        populate: ['chargingStations', 'feedLine', 'transformers'],
      },
    );
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

  async listLoadSiteUidMapping(): Promise<LoadSiteUidMappingData> {
    const loadSites = await this.loadSiteRepository.find(
      {
        uid: { $ne: '' },
      },
      {
        populate: ['chargingStations', 'transformers'],
        fields: ['uid', 'chargingStations.uid', 'transformers.uid'],
      },
    );

    const mapping = {};
    for (const loadSite of loadSites) {
      const transformerUids = loadSite.transformers
        .map((t) => t.uid)
        .filter(Boolean);
      const chargingStationUids = loadSite.chargingStations
        .map((cs) => cs.uid)
        .filter(Boolean);

      if (transformerUids.length || chargingStationUids.length) {
        mapping[loadSite.uid] = {
          transformer: transformerUids,
          charging_station: chargingStationUids,
        };
      }
    }
    return mapping;
  }
}
