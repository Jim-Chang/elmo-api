import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ChargingStationHistoryDataService } from '../../../application/history-data/charging-station-history-data-service/charging-station-history-data.service';
import { API_PREFIX } from '../../../../constants';
import {
  HistoryDataDto,
  HistoryDataQueryDto,
} from './dto/history-data-query.dto';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { ChargingStationService } from '../../../application/charging-station/charging-station.service';
import { AvailableCapacityService } from '../../../application/available-capacity/available-capacity.service';
import { DateTime } from 'luxon';

@Controller(`${API_PREFIX}/charging-station`)
@UsePipes(ZodValidationPipe)
export class ChargingStationController {
  constructor(
    private readonly chargingStationService: ChargingStationService,
    private readonly chargingStationHistoryDataService: ChargingStationHistoryDataService,
    private readonly availableCapacityService: AvailableCapacityService,
  ) {}

  @Get('history/:id/fifteen-minute')
  async getChargingStationFifteenMinuteHistoryData(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryDataQueryDto,
  ): Promise<HistoryDataDto> {
    const uid = await this.chargingStationService.getUid(id);

    const data =
      await this.chargingStationHistoryDataService.queryInFifteenMinuteDataInterval(
        uid,
        query.start_date,
        query.end_date,
      );

    const availableCapacityData =
      await this.availableCapacityService.getAvailableCapacitiesByDateRangeInFifteenMinuteInterval(
        id,
        query.start_date,
        query.end_date,
      );

    const contractCapacity =
      await this.chargingStationService.getContractCapacityById(id);

    const timeMarkToAvailableCapacityMap = new Map(
      availableCapacityData.map((item) => [
        DateTime.fromJSDate(item.datetime, {
          zone: 'utc',
        }).toISO(),
        item,
      ]),
    );

    const mergedData = data.map((item) => {
      const matchingCapacityData = timeMarkToAvailableCapacityMap.get(
        item.time_mark,
      );

      return {
        ...item,
        available_capacity: matchingCapacityData?.availableCapacity ?? 0,
        contract_capacity: contractCapacity,
        is_in_emergency: matchingCapacityData?.isInEmergency ? 1 : null,
      };
    });

    return { data: mergedData };
  }

  @Get('history/:id/one-hour')
  async getChargingStationOneHourHistoryData(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryDataQueryDto,
  ): Promise<HistoryDataDto> {
    const uid = await this.chargingStationService.getUid(id);

    const data =
      await this.chargingStationHistoryDataService.queryInOneHourDataInterval(
        uid,
        query.start_date,
        query.end_date,
      );

    const availableCapacityData =
      await this.availableCapacityService.getAvailableCapacitiesByDateRangeInOneHourInterval(
        id,
        query.start_date,
        query.end_date,
      );

    const contractCapacity =
      await this.chargingStationService.getContractCapacityById(id);

    const timeMarkToAvailableCapacityMap = new Map(
      availableCapacityData.map((item) => [
        DateTime.fromJSDate(item.datetime, {
          zone: 'utc',
        }).toISO(),
        item,
      ]),
    );

    const mergedData = data.map((item) => {
      const matchingCapacityData = timeMarkToAvailableCapacityMap.get(
        item.time_mark,
      );

      return {
        ...item,
        available_capacity: matchingCapacityData?.availableCapacity ?? null,
        contract_capacity: contractCapacity,
      };
    });

    return { data: mergedData };
  }

  @Get('history/:id/one-day')
  async getChargingStationOneDayHistoryData(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryDataQueryDto,
  ): Promise<HistoryDataDto> {
    const uid = await this.chargingStationService.getUid(id);

    const data =
      await this.chargingStationHistoryDataService.queryInOneDayDataInterval(
        uid,
        query.start_date,
        query.end_date,
      );

    return { data };
  }
}
