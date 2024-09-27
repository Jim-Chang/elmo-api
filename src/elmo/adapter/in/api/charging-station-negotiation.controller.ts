import { Controller, Get, Logger, Query, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { ChargingStationService } from '../../../application/charging-station/charging-station.service';
import {
  ChargingStationNegotiationListDataDto,
  ChargingStationNegotiationListQueryDto,
} from './dto/charging-station-negotiation-list.dto';
import { DateTime } from 'luxon';
import { TAIPEI_TZ } from '../../../../constants';

@Controller('/api/charging-station-negotiation')
@UsePipes(ZodValidationPipe)
export class ChargingStationNegotiationController {
  private logger = new Logger(ChargingStationNegotiationController.name);

  constructor(private chargingStationService: ChargingStationService) {}

  @Get()
  async getListItems(
    @Query() query: ChargingStationNegotiationListQueryDto,
  ): Promise<ChargingStationNegotiationListDataDto> {
    const filterBy = {
      date: DateTime.fromFormat(query.date, 'yyyy-MM-dd', {
        zone: TAIPEI_TZ,
      }).toJSDate(),
      districtId: query.district_id,
      feedLineId: query.feed_line_id,
      loadSiteId: query.load_site_id,
      negotiationStatusList: query.negotiation_status,
      keyword: query.keyword,
    };

    const chargingStations =
      await this.chargingStationService.findChargingStationWithNegotiation(
        filterBy,
      );

    const itemDataList = chargingStations.map((chargingStation) => ({
      id: chargingStation.id,
      uid: chargingStation.uid,
      feed_line: chargingStation.feedLine?.name ?? null,
      electricity_account_no: chargingStation.electricityAccountNo ?? null,
      charging_station_name: chargingStation.name,
      load_site_name: chargingStation.loadSite?.name ?? null,
      negotiation_status:
        chargingStation.negotiations[0]?.lastDetailStatus ?? null,
    }));

    return {
      items: itemDataList,
    };
  }
}
