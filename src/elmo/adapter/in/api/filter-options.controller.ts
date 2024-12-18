import { Controller, Get, UseGuards } from '@nestjs/common';
import { API_PREFIX } from '../../../../constants';
import { ReqUserId } from '../decorator/req-user-id';
import { FeederService } from '../../../application/feeder/feeder.service';
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
    private readonly feederService: FeederService,
    private readonly districtService: DistrictService,
    private readonly treeGeneratorService: TreeGeneratorService,
    private readonly userService: UserService,
  ) {}

  @Get('feeders')
  async getFeederOptions(
    @ReqUserId() reqUserId: number,
  ): Promise<OptionsResponseDto> {
    const user = await this.userService.getUserById(reqUserId);
    const feeders = await this.feederService.getAllFeeders(user);
    return {
      options: feeders.map((fl) => ({ id: fl.id, name: fl.name })),
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
