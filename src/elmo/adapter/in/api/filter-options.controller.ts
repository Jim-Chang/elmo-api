import { Controller, Get, UseGuards } from '@nestjs/common';
import { API_PREFIX } from '../../../../constants';
import { ReqUserId } from '../decorator/req-user-id';
import { FeedLineService } from '../../../application/feed-line/feed-line.service';
import {
  OptionsResponseDto,
  TreeDataResponseDto,
} from './dto/filter-options.dto';
import { DistrictService } from '../../../application/district/district.service';
import { TreeGeneratorService } from '../../../application/tree/tree-generator.service';
import { AuthUserGuard } from '../guard/auth-user.guard';
import { UserService } from '../../../application/user/user.service';

@Controller(`${API_PREFIX}/filter-options`)
@UseGuards(AuthUserGuard)
export class FilterOptionsController {
  constructor(
    private readonly feedLineService: FeedLineService,
    private readonly districtService: DistrictService,
    private readonly treeGeneratorService: TreeGeneratorService,
    private readonly userService: UserService,
  ) {}

  @Get('feed-lines')
  async getFeedLineOptions(
    @ReqUserId() reqUserId: number,
  ): Promise<OptionsResponseDto> {
    const user = await this.userService.getUserById(reqUserId);
    const feedLines = await this.feedLineService.getAllFeedLines(user);
    return {
      options: feedLines.map((fl) => ({ id: fl.id, name: fl.name })),
    };
  }

  @Get('districts')
  async getDistrictOptions(
    @ReqUserId() reqUserId: number,
  ): Promise<OptionsResponseDto> {
    const user = await this.userService.getUserById(reqUserId);
    const districts = await this.districtService.getAllActivateDistricts(user);
    return {
      options: districts.map((d) => ({ id: d.id, name: d.name })),
    };
  }

  @Get('tree')
  async getTree(@ReqUserId() reqUserId: number): Promise<TreeDataResponseDto> {
    const user = await this.userService.getUserById(reqUserId);
    const treeData = await this.treeGeneratorService.getTree(user);
    return {
      tree: treeData,
    };
  }
}
