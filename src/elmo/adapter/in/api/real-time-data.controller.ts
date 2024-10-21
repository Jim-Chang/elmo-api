import { Controller, Get, Query } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AvailableCapacityService } from '../../../application/available-capacity/available-capacity.service';
import { LoadSiteService } from '../../../application/load-site/load-site.service';
import { RealTimeDataService } from '../../../application/real-time-data/real-time-data.service';
import {
  LoadSiteRealTimeDataListDataDto,
  RealTimeDataListQueryDto,
} from './dto/real-time-data-list.dto';

@Controller('/api/real-time-data')
export class RealTimeDataController {
  constructor(
    private readonly realTimeDataService: RealTimeDataService,
    private readonly availableCapacityService: AvailableCapacityService,
    private readonly loadSiteService: LoadSiteService,
  ) {}

  @Get()
  async getListItems(
    @Query() query: RealTimeDataListQueryDto,
  ): Promise<LoadSiteRealTimeDataListDataDto> {
    const now = DateTime.now();

    const filterBy = {
      districtId: query.district_id,
      feedLineId: query.feed_line_id,
      keyword: query.keyword,
    };

    const loadSites =
      await this.loadSiteService.findLoadSiteWithChargeStationAndTransformer(
        filterBy,
      );

    const itemDataList = await Promise.all(
      loadSites.map(async (loadSite) => {
        // Get transformer real time data
        const transformer = loadSite.transformers[0];
        const transformerData =
          transformer && transformer.uid
            ? await this.realTimeDataService.getTransformerRealTimeData(
                transformer.uid,
              )
            : null;

        // Get charging station real time data
        const chargingStation = loadSite.chargingStations[0];
        const chargingStationData = chargingStation
          ? await this.realTimeDataService.getChargingStationRealTimeData(
              chargingStation.uid,
            )
          : null;

        // Get total/charge/demand loads
        const totalLoad = transformerData?.ac_power_meter_output_kw ?? null;

        const chargeLoad = chargingStationData?.kw ?? null;
        // Calculate demand load
        const demandLoad =
          totalLoad !== null && chargeLoad !== null
            ? totalLoad - chargeLoad
            : null;

        // Get available capacity of charging station
        const availableCapacity =
          await this.availableCapacityService.getAvailableCapacityByDateTime(
            chargingStation.id,
            now.toJSDate(),
          );

        // Get update time
        const transformerTimeMark =
          transformerData && transformerData.time_mark
            ? DateTime.fromJSDate(transformerData.time_mark)
            : null;
        const chargingStationTimeMark =
          chargingStationData && chargingStationData.time_mark
            ? DateTime.fromJSDate(chargingStationData.time_mark)
            : null;

        const updateAt = this.realTimeDataService.determineUpdateAt(
          transformerTimeMark,
          chargingStationTimeMark,
        );

        return {
          load_site_id: loadSite.id,
          load_site_name: loadSite.name,
          feed_line_name: loadSite.feedLine?.name ?? null,
          total_load: totalLoad,
          demand_load: demandLoad,
          charge_load: chargeLoad,
          charge_load_percentage:
            chargeLoad && totalLoad ? (chargeLoad / totalLoad) * 100 : null,
          available_capacity: availableCapacity,
          updated_at: updateAt?.toISO() ?? null,
        };
      }),
    );

    return {
      items: itemDataList,
    };
  }
}
