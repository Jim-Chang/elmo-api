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
}
