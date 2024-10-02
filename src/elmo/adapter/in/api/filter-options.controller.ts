import { Controller, Get } from '@nestjs/common';
import { FeedLineService } from '../../../application/feed-line/feed-line.service';
import { OptionsResponseDto } from './dto/filter-options.dto';
import { DistrictService } from '../../../application/district/district.service';

@Controller('/api/filter-options')
export class FilterOptionsController {
  constructor(
    private readonly feedLineService: FeedLineService,
    private readonly districtService: DistrictService,
  ) {}

  @Get('feed-lines')
  async getFeedLineOptions(): Promise<OptionsResponseDto> {
    const feedLines = await this.feedLineService.getAllFeedLines();
    return {
      options: feedLines.map((fl) => ({ id: fl.id, name: fl.name })),
    };
  }

  @Get('districts')
  async getDistrictOptions(): Promise<OptionsResponseDto> {
    const districts = await this.districtService.getAllDistricts();
    return {
      options: districts.map((d) => ({ id: d.id, name: d.name })),
    };
  }
}
