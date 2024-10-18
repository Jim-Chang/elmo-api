import { Controller, Get } from '@nestjs/common';
import { FeedLineService } from '../../../application/feed-line/feed-line.service';
import {
  OptionsResponseDto,
  TreeDataResponseDto,
} from './dto/filter-options.dto';
import { DistrictService } from '../../../application/district/district.service';
import { TreeGeneratorService } from '../../../application/tree/tree-generator.service';

@Controller('/api/filter-options')
export class FilterOptionsController {
  constructor(
    private readonly feedLineService: FeedLineService,
    private readonly districtService: DistrictService,
    private readonly treeGeneratorService: TreeGeneratorService,
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

  @Get('tree')
  async getTree(): Promise<TreeDataResponseDto> {
    const treeData = await this.treeGeneratorService.getTree();
    return {
      tree: treeData,
    };
  }
}
