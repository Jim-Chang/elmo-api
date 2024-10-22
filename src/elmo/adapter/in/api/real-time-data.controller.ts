import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { DateTime } from 'luxon';
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
  TransformerRealTimeDataDto,
} from './dto/real-time-data.dto';

@Controller('/api/real-time-data')
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
        // Get transformer real time data
        const transformer = loadSite.transformers?.[0] ?? null;
        const transformerData =
          transformer && transformer.uid
            ? await this.realTimeDataService.getTransformerRealTimeData(
                transformer.uid,
              )
            : null;

        // Get charging station real time data
        const chargingStation = loadSite.chargingStations?.[0] ?? null;
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
        const availableCapacity = chargingStation
          ? await this.availableCapacityService.getAvailableCapacityByDateTime(
              chargingStation.id,
              now.toJSDate(),
            )
          : null;

        // Get update time
        const transformerTimeMark = transformerData?.time_mark
          ? DateTime.fromJSDate(transformerData.time_mark)
          : null;
        const chargingStationTimeMark = chargingStationData?.time_mark
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
    @Param('id') id: number,
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
    @Param('id') id: number,
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
}
