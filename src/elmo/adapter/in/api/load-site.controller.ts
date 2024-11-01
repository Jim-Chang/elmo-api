import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UsePipes,
} from '@nestjs/common';
import { LoadSiteHistoryDataService } from '../../../application/history-data/load-site-history-data-service/load-site-history-data.service';
import { API_PREFIX } from '../../../../constants';
import {
  HistoryDataDto,
  HistoryDataQueryDto,
} from './dto/history-data-query.dto';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { LoadSiteDetailDataDto } from './dto/load-site-detail-data.dto';
import { LoadSiteUidMappingDto } from './dto/load-site-uid-mapping.dto';
import { LoadSiteService } from '../../../application/load-site/load-site.service';
import { ChargingStationService } from '../../../application/charging-station/charging-station.service';
import { AvailableCapacityService } from '../../../application/available-capacity/available-capacity.service';
import { DateTime } from 'luxon';

@Controller(`${API_PREFIX}/load-site`)
@UsePipes(ZodValidationPipe)
export class LoadSiteController {
  constructor(
    private readonly loadSiteService: LoadSiteService,
    private readonly loadSiteHistoryDataService: LoadSiteHistoryDataService,
    private readonly chargingStationService: ChargingStationService,
    private readonly availableCapacityService: AvailableCapacityService,
  ) {}

  @Get('uid-mapping')
  async getUidMapping(): Promise<LoadSiteUidMappingDto> {
    return await this.loadSiteService.listLoadSiteUidMapping();
  }

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
      load_site_uid: loadSite.uid,
      load_site_name: loadSite.name,
      load_site_category: loadSite.category,
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
        electricity_account_no: cs.electricityAccountNo,
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

  @Get('history/:id/fifteen-minute')
  async getLoadSiteFifteenMinuteHistoryData(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryDataQueryDto,
  ): Promise<HistoryDataDto> {
    const uid = await this.loadSiteService.getUid(id);
    const chargingStations =
      await this.chargingStationService.findChargingStationByLoadSiteId(id);

    const data =
      await this.loadSiteHistoryDataService.queryInFifteenMinuteDataInterval(
        uid,
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
  async getLoadSiteOneHourHistoryData(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryDataQueryDto,
  ): Promise<HistoryDataDto> {
    const uid = await this.loadSiteService.getUid(id);
    const chargingStations =
      await this.chargingStationService.findChargingStationByLoadSiteId(id);

    const data =
      await this.loadSiteHistoryDataService.queryInOneHourDataInterval(
        uid,
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
  async getLoadSiteOneDayHistoryData(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryDataQueryDto,
  ): Promise<HistoryDataDto> {
    const uid = await this.loadSiteService.getUid(id);

    const data =
      await this.loadSiteHistoryDataService.queryInOneDayDataInterval(
        uid,
        query.start_date,
        query.end_date,
      );

    return { data };
  }
}
