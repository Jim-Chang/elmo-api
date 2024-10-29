import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UsePipes,
} from '@nestjs/common';
import { FeedLineHistoryDataService } from '../../../application/history-data/feed-line-history-data-service/feed-line-history-data.service';
import { API_PREFIX } from '../../../../constants';
import {
  HistoryDataDto,
  HistoryDataQueryDto,
} from './dto/history-data-query.dto';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { LoadSiteService } from '../../../application/load-site/load-site.service';

@Controller(`${API_PREFIX}/feed-line`)
@UsePipes(ZodValidationPipe)
export class FeedLineController {
  constructor(
    private readonly loadSiteService: LoadSiteService,
    private readonly feedLineHistoryDataService: FeedLineHistoryDataService,
  ) {}

  @Get('history/:id/fifteen-minute')
  async getFeedLineFifteenMinuteHistoryData(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryDataQueryDto,
  ): Promise<HistoryDataDto> {
    const loadSiteUids = await this.loadSiteService.getUidsByFeedLineId(id);

    const data =
      await this.feedLineHistoryDataService.queryInFifteenMinuteDataInterval(
        loadSiteUids,
        query.start_date,
        query.end_date,
      );

    return { data };
  }

  @Get('history/:id/one-hour')
  async getFeedLineOneHourHistoryData(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryDataQueryDto,
  ): Promise<HistoryDataDto> {
    const loadSiteUids = await this.loadSiteService.getUidsByFeedLineId(id);

    const data =
      await this.feedLineHistoryDataService.queryInOneHourDataInterval(
        loadSiteUids,
        query.start_date,
        query.end_date,
      );

    return { data };
  }

  @Get('history/:id/one-day')
  async getFeedLineOneDayHistoryData(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: HistoryDataQueryDto,
  ): Promise<HistoryDataDto> {
    const loadSiteUids = await this.loadSiteService.getUidsByFeedLineId(id);

    const data =
      await this.feedLineHistoryDataService.queryInOneDayDataInterval(
        loadSiteUids,
        query.start_date,
        query.end_date,
      );

    return { data };
  }
}
