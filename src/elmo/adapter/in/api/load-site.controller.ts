import { ZodValidationPipe } from '@anatine/zod-nestjs';
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UsePipes,
} from '@nestjs/common';
import { API_PREFIX } from '../../../../constants';
import { LoadSiteDetailDataDto } from './dto/load-site-detail-data.dto';
import { LoadSiteService } from '../../../application/load-site/load-site.service';

@Controller(`${API_PREFIX}/load-site`)
@UsePipes(ZodValidationPipe)
export class LoadSiteController {
  constructor(private readonly loadSiteService: LoadSiteService) {}

  @Get(':id')
  async getLoadSiteDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LoadSiteDetailDataDto> {
    const loadSite = await this.loadSiteService.getLoadSiteById(id);
    if (!loadSite) {
      throw new BadRequestException(`Load site with id ${id} does not exist`);
    }

    return {
      load_site_id: loadSite.id,
      load_site_name: loadSite.name,
      load_site_address: loadSite.address ?? null,
      feed_line: loadSite.feedLine
        ? {
            id: loadSite.feedLine.id,
            name: loadSite.feedLine.name,
          }
        : null,
      charging_stations: loadSite.chargingStations.map((cs) => ({
        id: cs.id,
        uid: cs.uid,
        name: cs.name,
        contract_capacity: cs.contractCapacity,
      })),
      transformers: loadSite.transformers.map((t) => ({
        id: t.id,
        uid: t.uid,
        tpclid: t.tpclid,
        group: t.group,
        capacity: t.capacity,
        voltage_level: t.voltageLevel,
      })),
    };
  }
}
