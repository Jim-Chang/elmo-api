import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { FeederHistoryDataService } from '../../../application/history-data/feeder-history-data-service/feeder-history-data.service';
import { API_PREFIX } from '../../../../constants';
import {
  HistoryDataDto,
  HistoryDataQueryDto,
} from './dto/history-data-query.dto';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { LoadSiteService } from '../../../application/load-site/load-site.service';
import { ChargingStationService } from '../../../application/charging-station/charging-station.service';
import { DateTime } from 'luxon';
import { AvailableCapacityService } from '../../../application/available-capacity/available-capacity.service';
import { AuthUserGuard } from '../guard/auth-user.guard';

@Controller(`${API_PREFIX}/feeder`)
@UseGuards(AuthUserGuard)
@UsePipes(ZodValidationPipe)
export class FeederController {
  constructor(
    private readonly loadSiteService: LoadSiteService,
    private readonly feederHistoryDataService: FeederHistoryDataService,
    private readonly chargingStationService: ChargingStationService,
    private readonly availableCapacityService: AvailableCapacityService,
  ) {}

  @Get('history/:id/fifteen-minute')
  async getFeederFifteenMinuteHistoryData(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryDataQueryDto,
  ): Promise<HistoryDataDto> {
    const loadSiteUids = await this.loadSiteService.getUidsByFeederId(id);
    const chargingStations =
      await this.chargingStationService.findChargingStationByFeederId(id);

    const data =
      await this.feederHistoryDataService.queryInFifteenMinuteDataInterval(
        loadSiteUids,
        query.start_date,
        query.end_date,
      );

    const capacityResults = await Promise.all(
      chargingStations.map(async (chargingStation) => {
        const availableCapacityData =
          await this.availableCapacityService.getAvailableCapacitiesByDateRangeInFifteenMinuteInterval(
            chargingStation.id,
            query.start_date,
            query.end_date,
          );

        const contractCapacity =
          await this.chargingStationService.getContractCapacityById(
            chargingStation.id,
          );

        const timeMarkToAvailableCapacityMap = new Map(
          availableCapacityData.map((item) => [
            DateTime.fromJSDate(item.datetime, {
              zone: 'utc',
            }).toISO(),
            item,
          ]),
        );

        return {
          contractCapacity,
          timeMarkToAvailableCapacityMap,
        };
      }),
    );

    const mergedData = data.map((item) => {
      let totalAvailableCapacity = 0;
      let totalContractCapacity = 0;
      let totalIsInEmergency = false;

      capacityResults.forEach(
        ({ contractCapacity, timeMarkToAvailableCapacityMap }) => {
          const matchingCapacityData = timeMarkToAvailableCapacityMap.get(
            item.time_mark,
          );

          totalAvailableCapacity +=
            matchingCapacityData?.availableCapacity ?? 0;
          totalContractCapacity += contractCapacity;
          totalIsInEmergency =
            totalIsInEmergency || matchingCapacityData?.isInEmergency;
        },
      );

      return {
        ...item,
        available_capacity: totalAvailableCapacity,
        contract_capacity: totalContractCapacity,
        is_in_emergency: totalIsInEmergency ? 1 : null,
      };
    });

    return { data: mergedData };
  }

  @Get('history/:id/one-hour')
  async getFeederOneHourHistoryData(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryDataQueryDto,
  ): Promise<HistoryDataDto> {
    const loadSiteUids = await this.loadSiteService.getUidsByFeederId(id);
    const chargingStations =
      await this.chargingStationService.findChargingStationByFeederId(id);

    const data = await this.feederHistoryDataService.queryInOneHourDataInterval(
      loadSiteUids,
      query.start_date,
      query.end_date,
    );

    const capacityResults = await Promise.all(
      chargingStations.map(async (chargingStation) => {
        const availableCapacityData =
          await this.availableCapacityService.getAvailableCapacitiesByDateRangeInOneHourInterval(
            chargingStation.id,
            query.start_date,
            query.end_date,
          );

        const contractCapacity =
          await this.chargingStationService.getContractCapacityById(
            chargingStation.id,
          );

        const timeMarkToAvailableCapacityMap = new Map(
          availableCapacityData.map((item) => [
            DateTime.fromJSDate(item.datetime, { zone: 'utc' }).toISO(),
            item,
          ]),
        );

        return {
          contractCapacity,
          timeMarkToAvailableCapacityMap,
        };
      }),
    );

    const mergedData = data.map((item) => {
      let totalAvailableCapacity = 0;
      let totalContractCapacity = 0;

      capacityResults.forEach(
        ({ contractCapacity, timeMarkToAvailableCapacityMap }) => {
          const matchingCapacityData = timeMarkToAvailableCapacityMap.get(
            item.time_mark,
          );

          totalAvailableCapacity +=
            matchingCapacityData?.availableCapacity ?? 0;
          totalContractCapacity += contractCapacity;
        },
      );

      return {
        ...item,
        available_capacity: totalAvailableCapacity,
        contract_capacity: totalContractCapacity,
      };
    });

    return { data: mergedData };
  }

  @Get('history/:id/one-day')
  async getFeederOneDayHistoryData(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryDataQueryDto,
  ): Promise<HistoryDataDto> {
    const loadSiteUids = await this.loadSiteService.getUidsByFeederId(id);

    const data = await this.feederHistoryDataService.queryInOneDayDataInterval(
      loadSiteUids,
      query.start_date,
      query.end_date,
    );

    return { data };
  }
}
