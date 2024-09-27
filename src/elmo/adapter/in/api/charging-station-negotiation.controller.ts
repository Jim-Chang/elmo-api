import {
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { ChargingStationService } from '../../../application/charging-station/charging-station.service';
import {
  ChargingStationNegotiationListDataDto,
  ChargingStationNegotiationListQueryDto,
} from './dto/charging-station-negotiation-list.dto';
import { DateTime } from 'luxon';
import { TAIPEI_TZ } from '../../../../constants';
import { ChargingStationNegotiationDto } from './dto/charging-station-negotiation.dto';
import { AvailableCapacityNegotiationService } from '../../../application/available-capacity/available-capacity-negotiation.service';

@Controller('/api/charging-station-negotiation')
@UsePipes(ZodValidationPipe)
export class ChargingStationNegotiationController {
  private logger = new Logger(ChargingStationNegotiationController.name);

  constructor(
    private chargingStationService: ChargingStationService,
    private availableCapacityNegotiationService: AvailableCapacityNegotiationService,
  ) {}

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
      negotiation_id: chargingStation.negotiations[0]?.id ?? null,
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

  @Get('/negotiation/:id')
  async getNegotiationDetail(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ChargingStationNegotiationDto> {
    const negotiation =
      await this.availableCapacityNegotiationService.getNegotiationById(id);
    if (negotiation === null) {
      throw new NotFoundException(`Negotiation with id ${id} not found`);
    }

    // TODO: should get all negotiation details
    const negotiationDetail =
      await this.availableCapacityNegotiationService.getNegotiationDetailByStatus(
        negotiation,
        negotiation.lastDetailStatus,
      );
    if (negotiationDetail === null) {
      throw new NotFoundException(
        `Negotiation detail with status ${negotiation.lastDetailStatus} not found`,
      );
    }

    const chargingStation =
      await this.chargingStationService.findChargingStationByNegotiationId(
        negotiation.id,
      );

    return {
      charging_station: {
        name: chargingStation.name,
        contract_capacity: chargingStation.contractCapacity,
      },
      negotiation_id: negotiation.id,
      date: negotiation.date,
      status: negotiation.lastDetailStatus,
      // TODO: should return all negotiation details
      hour_capacities: negotiationDetail.hourCapacities,
    };
  }
}
