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

@Controller(`${API_PREFIX}/charging-station`)
@UsePipes(ZodValidationPipe)
export class ChargingStationController {
  constructor(
    private readonly chargingStationService: ChargingStationService,
    private readonly chargingStationHistoryDataService: ChargingStationHistoryDataService,
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

    return { data };
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

    return { data };
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
