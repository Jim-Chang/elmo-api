import { ZodValidationPipe } from '@anatine/zod-nestjs';
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UsePipes,
} from '@nestjs/common';
import { DateTime } from 'luxon';
import { API_PREFIX } from '../../../../constants';
import { AvailableCapacityService } from '../../../application/available-capacity/available-capacity.service';
import { LoadSiteService } from '../../../application/load-site/load-site.service';
import { RealTimeDataService } from '../../../application/real-time-data/real-time-data.service';
import {
  LoadSiteRealTimeDataListDataDto,
  RealTimeDataListQueryDto,
} from './dto/real-time-data-list.dto';
import { ChargingStationService } from '../../../application/charging-station/charging-station.service';
import { TransformerService } from '../../../application/transformer/transformer.service';
import {
  ChargingStationRealTimeDataDto,
  LoadSiteRealTimeDataDto,
  TransformerRealTimeDataDto,
} from './dto/real-time-data.dto';
import {
  ChargingStationRealTimeData,
  TransformerRealTimeData,
} from '../../../application/real-time-data/types';

@Controller(`${API_PREFIX}/real-time-data`)
@UsePipes(ZodValidationPipe)
export class RealTimeDataController {
  constructor(
    private readonly realTimeDataService: RealTimeDataService,
    private readonly availableCapacityService: AvailableCapacityService,
    private readonly chargingStationService: ChargingStationService,
    private readonly loadSiteService: LoadSiteService,
    private readonly transformerService: TransformerService,
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
        const transformers = loadSite.transformers;
        const chargingStations = loadSite.chargingStations;

        // Get real time data of transformers
        const transformerDataset: TransformerRealTimeData[] =
          await this.realTimeDataService.collectMultipleTransformerRealTimeData(
            transformers.map((t) => t.uid),
          );

        // Get real time data of charging stations
        const chargingStationDataset: ChargingStationRealTimeData[] =
          await this.realTimeDataService.collectMultipleChargingStationRealTimeData(
            chargingStations.map((cs) => cs.uid),
          );

        // Get total/charge/demand loads
        const totalLoad =
          this.realTimeDataService.determineTotalLoadKw(transformerDataset);

        const chargeLoad = this.realTimeDataService.determineChargeLoadKw(
          chargingStationDataset,
        );

        const demandLoad = this.realTimeDataService.determineDemandLoadKw(
          totalLoad,
          chargeLoad,
        );

        // Get available capacity from charging stations
        const availableCapacities = await Promise.all(
          chargingStations.map(
            async (chargingStation) =>
              await this.availableCapacityService.getAvailableCapacityByDateTime(
                chargingStation.id,
                now.toJSDate(),
              ),
          ),
        );

        const totalAvailableCapacity = availableCapacities.reduce(
          (acc, curr) => acc + curr,
          0,
        );

        // Get update time
        const transformerTimeMark =
          this.realTimeDataService.getEarliestTimeMark(
            transformerDataset.map((t) =>
              t.time_mark ? DateTime.fromJSDate(t.time_mark) : null,
            ),
          );
        const chargingStationTimeMark =
          this.realTimeDataService.getEarliestTimeMark(
            chargingStationDataset.map((cs) =>
              cs.time_mark ? DateTime.fromJSDate(cs.time_mark) : null,
            ),
          );

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
            this.realTimeDataService.calculateChargeLoadPercentage(
              chargeLoad,
              totalLoad,
            ),
          available_capacity: totalAvailableCapacity,
          updated_at: updateAt?.setZone('utc').toISO() ?? null,
        };
      }),
    );

    return {
      items: itemDataList,
    };
  }

  @Get('charging-station/:id')
  async getChargingStationRealTimeData(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ChargingStationRealTimeDataDto> {
    const chargingStation =
      await this.chargingStationService.getChargingStationById(id);

    if (!chargingStation) {
      throw new BadRequestException(
        `Charging station with id ${id} does not exist`,
      );
    }

    const data = await this.realTimeDataService.getChargingStationRealTimeData(
      chargingStation.uid,
    );

    const timeMark = data?.time_mark
      ? DateTime.fromJSDate(data.time_mark)
      : null;

    // Get available capacity of charging station at the time mark
    const availableCapacity = timeMark
      ? await this.availableCapacityService.getAvailableCapacityByDateTime(
          chargingStation.id,
          timeMark.toJSDate(),
        )
      : null;

    return {
      uid: chargingStation.uid,
      time_mark: timeMark?.setZone('utc').toISO() ?? null,
      kw: data?.kw ?? null,
      available_capacity: availableCapacity,
    };
  }

  @Get('transformer/:id')
  async getTransformerRealTimeData(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TransformerRealTimeDataDto> {
    const transformer = await this.transformerService.getTransformerById(id);

    if (!transformer) {
      throw new BadRequestException(`Transformer with id ${id} does not exist`);
    }

    const data = await this.realTimeDataService.getTransformerRealTimeData(
      transformer.uid,
    );

    return {
      uid: transformer.uid,
      time_mark: data?.time_mark
        ? DateTime.fromJSDate(data.time_mark).setZone('utc').toISO()
        : null,

      ac_power_meter_output_kw: data?.ac_power_meter_output_kw ?? null,
      ac_power_meter_output_kvar: data?.ac_power_meter_output_kvar ?? null,
      ac_power_meter_output_kva: data?.ac_power_meter_output_kva ?? null,
      ac_power_meter_output_pf: data?.ac_power_meter_output_pf ?? null,
      ac_power_meter_freq: data?.ac_power_meter_freq ?? null,

      ac_power_meter_line_amps_a: data?.ac_power_meter_line_amps_a ?? null,
      ac_power_meter_line_amps_b: data?.ac_power_meter_line_amps_b ?? null,
      ac_power_meter_line_amps_c: data?.ac_power_meter_line_amps_c ?? null,

      ac_power_meter_line_volts_a_b:
        data?.ac_power_meter_line_volts_a_b ?? null,
      ac_power_meter_line_volts_b_c:
        data?.ac_power_meter_line_volts_b_c ?? null,
      ac_power_meter_line_volts_c_a:
        data?.ac_power_meter_line_volts_c_a ?? null,

      ac_power_meter_output_kwh: data?.ac_power_meter_output_kwh ?? null,
      ac_power_meter_output_kvarh: data?.ac_power_meter_output_kvarh ?? null,
      ac_power_meter_output_kvah: data?.ac_power_meter_output_kvah ?? null,

      ac_power_meter_input_kwh: data?.ac_power_meter_input_kwh ?? null,
      ac_power_meter_input_kvarh: data?.ac_power_meter_input_kvarh ?? null,
      ac_power_meter_input_kvah: data?.ac_power_meter_input_kvah ?? null,
    };
  }

  @Get('load-site/:id')
  async getLoadSiteRealTimeData(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<LoadSiteRealTimeDataDto> {
    const loadSite = await this.loadSiteService.getLoadSiteById(id);

    if (!loadSite) {
      throw new BadRequestException(`Load site with id ${id} does not exist`);
    }

    const now = DateTime.now();
    const transformers = loadSite.transformers;
    const chargingStations = loadSite.chargingStations;

    // Get real time data of transformers
    const transformerDataset: TransformerRealTimeData[] =
      await this.realTimeDataService.collectMultipleTransformerRealTimeData(
        transformers.map((t) => t.uid),
      );

    // Get real time data of charging stations
    const chargingStationDataset: ChargingStationRealTimeData[] =
      await this.realTimeDataService.collectMultipleChargingStationRealTimeData(
        chargingStations.map((cs) => cs.uid),
      );

    // 變壓器更新時間（最舊）
    const transformerTimeMark = this.realTimeDataService.getEarliestTimeMark(
      transformerDataset.map((t) =>
        t.time_mark ? DateTime.fromJSDate(t.time_mark) : null,
      ),
    );

    // 充電站更新時間（最舊）
    const chargingStationTimeMark =
      this.realTimeDataService.getEarliestTimeMark(
        chargingStationDataset.map((cs) =>
          cs.time_mark ? DateTime.fromJSDate(cs.time_mark) : null,
        ),
      );

    // 總負載
    const totalLoadKw =
      this.realTimeDataService.determineTotalLoadKw(transformerDataset);

    // 充電負載
    const chargeLoadKw = this.realTimeDataService.determineChargeLoadKw(
      chargingStationDataset,
    );

    // 一般負載
    const demandLoadKw = this.realTimeDataService.determineDemandLoadKw(
      totalLoadKw,
      chargeLoadKw,
    );

    // 充電站可用容量
    const availableCapacities = await Promise.all(
      chargingStations.map(
        async (chargingStation) =>
          await this.availableCapacityService.getAvailableCapacityByDateTime(
            chargingStation.id,
            now.toJSDate(),
          ),
      ),
    );

    const totalAvailableCapacity = availableCapacities.reduce(
      (acc, curr) => acc + curr,
      0,
    );

    return {
      uid: loadSite.uid,
      transformer_time_mark:
        transformerTimeMark?.setZone('utc').toISO() ?? null,
      charging_station_time_mark:
        chargingStationTimeMark?.setZone('utc').toISO() ?? null,
      total_load_kw: totalLoadKw,
      demand_load_kw: demandLoadKw,
      charge_load_kw: chargeLoadKw,
      available_capacity: totalAvailableCapacity,
      today_negotiation_status: null, // TODO: 今日可用容量協商狀態
      tomorrow_negotiation_status: null, // TODO: 明日可用容量協商狀態
    };
  }
}
