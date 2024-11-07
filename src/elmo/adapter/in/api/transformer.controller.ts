import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { TransformerHistoryDataService } from '../../../application/history-data/transformer-history-data-service/transformer-history-data.service';
import { API_PREFIX } from '../../../../constants';
import {
  HistoryDataDto,
  HistoryDataQueryDto,
} from './dto/history-data-query.dto';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { TransformerService } from '../../../application/transformer/transformer.service';
import { AuthUserGuard } from '../guard/auth-user.guard';

@Controller(`${API_PREFIX}/transformer`)
@UseGuards(AuthUserGuard)
@UsePipes(ZodValidationPipe)
export class TransformerController {
  constructor(
    private readonly transformerService: TransformerService,
    private readonly transformerHistoryDataService: TransformerHistoryDataService,
  ) {}

  @Get('history/:id/fifteen-minute')
  async getTransformerFifteenMinuteHistoryData(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryDataQueryDto,
  ): Promise<HistoryDataDto> {
    const uid = await this.transformerService.getUid(id);

    const data =
      await this.transformerHistoryDataService.queryInFifteenMinuteDataInterval(
        uid,
        query.start_date,
        query.end_date,
      );

    return { data };
  }

  @Get('history/:id/one-hour')
  async getTransformerOneHourHistoryData(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryDataQueryDto,
  ): Promise<HistoryDataDto> {
    const uid = await this.transformerService.getUid(id);

    const data =
      await this.transformerHistoryDataService.queryInOneHourDataInterval(
        uid,
        query.start_date,
        query.end_date,
      );

    return { data };
  }

  @Get('history/:id/one-day')
  async getTransformerOneDayHistoryData(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryDataQueryDto,
  ): Promise<HistoryDataDto> {
    const uid = await this.transformerService.getUid(id);

    const data =
      await this.transformerHistoryDataService.queryInOneDayDataInterval(
        uid,
        query.start_date,
        query.end_date,
      );

    return { data };
  }
}
