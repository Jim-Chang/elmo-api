import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { ChargingStationService } from '../../../application/charging-station/charging-station.service';
import {
  ChargingStationNegotiationListDataDto,
  ChargingStationNegotiationListQueryDto,
} from './dto/charging-station-negotiation-list.dto';
import { DateTime } from 'luxon';
import { API_PREFIX, TAIPEI_TZ } from '../../../../constants';
import {
  ChargingStationNegotiationConfirmPostDataDto,
  ChargingStationNegotiationDetailDto,
  ChargingStationNegotiationDto,
  ChargingStationNegotiationEmergencyDto,
  ChargingStationNegotiationPostDataDto,
} from './dto/charging-station-negotiation.dto';
import { AvailableCapacityEmergencyEntity } from '../../out/entities/available-capacity-emergency.entity';
import { AvailableCapacityNegotiationService } from '../../../application/available-capacity/available-capacity-negotiation.service';
import { AvailableCapacityNegotiationDetailEntity } from '../../out/entities/available-capacity-negotiation-detail.entity';
import {
  EmergencyStatus,
  NegotiationStatus,
  NegotiationWithEmergencyStatus,
} from '../../../application/available-capacity/types';
import { AvailableCapacityEmergencyService } from '../../../application/available-capacity/available-capacity-emergency.service';
import { ChargingStationNegotiationStatusDataDto } from './dto/charging-station-negotiation-status.dto';
import { AuthUserGuard } from '../guard/auth-user.guard';
import { ReqUserId } from '../decorator/req-user-id';
import { UserService } from '../../../application/user/user.service';

@Controller(`${API_PREFIX}/charging-station-negotiation`)
@UseGuards(AuthUserGuard)
@UsePipes(ZodValidationPipe)
export class ChargingStationNegotiationController {
  private logger = new Logger(ChargingStationNegotiationController.name);

  constructor(
    private chargingStationService: ChargingStationService,
    private availableCapacityEmergencyService: AvailableCapacityEmergencyService,
    private availableCapacityNegotiationService: AvailableCapacityNegotiationService,
    private userService: UserService,
  ) {}

  @Get()
  async getListItems(
    @Query() query: ChargingStationNegotiationListQueryDto,
    @ReqUserId() reqUserId: number,
  ): Promise<ChargingStationNegotiationListDataDto> {
    const lastStatus = query.last_status;
    const user = await this.userService.getUserById(reqUserId);

    let negotiationStatusList: NegotiationStatus[];
    let emergencyStatus: EmergencyStatus;

    if (lastStatus) {
      negotiationStatusList = lastStatus.filter((status) =>
        Object.values(NegotiationStatus).includes(status as NegotiationStatus),
      ) as NegotiationStatus[];
      emergencyStatus = lastStatus.find((status) =>
        Object.values(EmergencyStatus).includes(status as EmergencyStatus),
      ) as EmergencyStatus;
    }

    const filterBy = {
      date: DateTime.fromFormat(query.date, 'yyyy-MM-dd', {
        zone: TAIPEI_TZ,
      }).toJSDate(),
      districtId: query.district_id,
      feedLineId: query.feed_line_id,
      loadSiteId: query.load_site_id,
      negotiationStatusList,
      emergencyStatus,
      keyword: query.keyword,
    };
    // If user has district, filter by user's district
    if (user.district) {
      filterBy.districtId = user.district.id;
    }

    const chargingStations =
      await this.chargingStationService.findChargingStationWithNegotiation(
        filterBy,
      );

    const itemDataList = chargingStations.map((chargingStation) => {
      const negotiation = chargingStation.negotiations[0];

      let lastStatus: NegotiationWithEmergencyStatus =
        negotiation.lastDetailStatus;
      if (negotiation.lastEmergency) {
        const now = DateTime.now();
        lastStatus =
          this.availableCapacityEmergencyService.determineLastEmergencyStatusByDateTime(
            negotiation.lastEmergency,
            now.toJSDate(),
          );
      }

      return {
        negotiation_id: negotiation?.id ?? null,
        feed_line: chargingStation.feedLine?.name ?? null,
        electricity_account_no: chargingStation.electricityAccountNo ?? null,
        charging_station_name: chargingStation.name,
        load_site_name: chargingStation.loadSite?.name ?? null,
        last_status: lastStatus,
      };
    });

    return {
      items: itemDataList,
    };
  }

  @Get('/negotiation/:id')
  async getNegotiation(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ChargingStationNegotiationDto> {
    const negotiation =
      await this.availableCapacityNegotiationService.getNegotiationById(id);
    if (negotiation === null) {
      throw new NotFoundException(`Negotiation with id ${id} not found`);
    }

    const negotiationDetails =
      await this.availableCapacityNegotiationService.getAllNegotiationDetailsByNegotiation(
        negotiation,
      );
    if (negotiationDetails.length === 0) {
      throw new NotFoundException(
        `Negotiation detail with negotiation id ${id} not found`,
      );
    }

    const chargingStation =
      await this.chargingStationService.findChargingStationByNegotiationId(
        negotiation.id,
      );

    const initialDetail = findDetailByStatus(
      negotiationDetails,
      NegotiationStatus.INITIAL,
    );

    const initialEditDetail =
      findDetailByStatus(negotiationDetails, NegotiationStatus.NEGOTIATING) ||
      findDetailByStatus(negotiationDetails, NegotiationStatus.INITIAL_EDIT);

    const requestDetail = findDetailByStatus(
      negotiationDetails,
      NegotiationStatus.EXTRA_REQUEST,
    );

    const replyEditDetail = findDetailByStatus(
      negotiationDetails,
      NegotiationStatus.EXTRA_REPLY_EDIT,
    );

    const replyDetail =
      findDetailByStatus(negotiationDetails, NegotiationStatus.FINISH) ||
      findDetailByStatus(
        negotiationDetails,
        NegotiationStatus.EXTRA_REPLY_FINISH,
      ) ||
      findDetailByStatus(
        negotiationDetails,
        NegotiationStatus.EXTRA_REPLY_AUTO,
      ) ||
      findDetailByStatus(
        negotiationDetails,
        NegotiationStatus.EXTRA_REPLY_FAILED,
      ) ||
      findDetailByStatus(
        negotiationDetails,
        NegotiationStatus.NEGOTIATING_FAILED,
      );

    const applyDetail = negotiation.applyDetail
      ? await this.availableCapacityNegotiationService.getNegotiationDetailById(
          negotiation.applyDetail.id,
        )
      : null;

    const lastEmergency = negotiation.lastEmergency
      ? await this.availableCapacityEmergencyService.getEmergencyById(
          negotiation.lastEmergency.id,
        )
      : null;

    let lastStatus: NegotiationWithEmergencyStatus =
      negotiation.lastDetailStatus;
    if (lastEmergency) {
      const now = DateTime.now();
      lastStatus =
        this.availableCapacityEmergencyService.determineLastEmergencyStatusByDateTime(
          lastEmergency,
          now.toJSDate(),
        );
    }

    return {
      charging_station: {
        name: chargingStation.name,
        contract_capacity: chargingStation.contractCapacity,
      },
      negotiation_id: negotiation.id,
      date: negotiation.date,
      initial_detail: buildNegotiationDetailDto(initialDetail),
      initial_edit_detail: buildNegotiationDetailDto(initialEditDetail),
      request_detail: requestDetail
        ? buildNegotiationDetailDto(requestDetail)
        : null,
      reply_edit_detail: replyEditDetail
        ? buildNegotiationDetailDto(replyEditDetail)
        : null,
      reply_detail: replyDetail ? buildNegotiationDetailDto(replyDetail) : null,
      apply_detail: applyDetail ? buildNegotiationDetailDto(applyDetail) : null,
      last_status: lastStatus,
      last_emergency: lastEmergency
        ? buildNegotiationEmergencyDto(lastEmergency)
        : null,
    };
  }

  @Get('/status/:chargingStationId')
  @HttpCode(HttpStatus.OK)
  async getStatus(
    @Param('chargingStationId', ParseIntPipe) chargingStationId: number,
  ): Promise<ChargingStationNegotiationStatusDataDto> {
    const now = DateTime.now().setZone(TAIPEI_TZ);
    const today = now.startOf('day');
    const tomorrow = now.plus({ days: 1 }).startOf('day');

    // 今日可用容量協商狀態
    const todayNegotiation =
      await this.availableCapacityNegotiationService.getNegotiationByChargingStationAndDate(
        chargingStationId,
        today.toJSDate(),
      );

    let todayStatus: NegotiationWithEmergencyStatus | null = null;
    if (todayNegotiation) {
      todayStatus = todayNegotiation.lastDetailStatus;

      const lastEmergency = todayNegotiation.lastEmergency
        ? await this.availableCapacityEmergencyService.getEmergencyById(
            todayNegotiation.lastEmergency.id,
          )
        : null;
      if (lastEmergency) {
        todayStatus =
          this.availableCapacityEmergencyService.determineLastEmergencyStatusByDateTime(
            lastEmergency,
            now.toJSDate(),
          );
      }
    }

    // 明日可用容量協商狀態
    const tomorrowNegotiation =
      await this.availableCapacityNegotiationService.getNegotiationByChargingStationAndDate(
        chargingStationId,
        tomorrow.toJSDate(),
      );

    const tomorrowStatus: NegotiationWithEmergencyStatus | null =
      tomorrowNegotiation?.lastDetailStatus ?? null;

    return {
      today_status: todayStatus,
      tomorrow_status: tomorrowStatus,
    };
  }

  @Post('/negotiation/edit-initial')
  @HttpCode(HttpStatus.OK)
  async editInitialNegotiation(
    @Body() negotiationPostData: ChargingStationNegotiationPostDataDto,
  ): Promise<ChargingStationNegotiationDetailDto> {
    const { negotiation_id, hour_capacities } = negotiationPostData;
    const negotiation =
      await this.availableCapacityNegotiationService.getNegotiationById(
        negotiation_id,
      );

    if (negotiation.lastDetailStatus !== NegotiationStatus.INITIAL_EDIT) {
      throw new ForbiddenException(
        `Negotiation with id ${negotiation_id} is not in initial edit status`,
      );
    }

    const negotiationDetail =
      await this.availableCapacityNegotiationService.updateInitialNegotiation(
        negotiation_id,
        hour_capacities as { hour: number; capacity: number }[],
      );

    return {
      id: negotiationDetail.id,
      status: negotiationDetail.status,
      hour_capacities: negotiationDetail.hourCapacities,
      created_at: negotiationDetail.createdAt,
    };
  }

  @Post('/negotiation/edit-extra-reply')
  @HttpCode(HttpStatus.OK)
  async editExtraReplyNegotiation(
    @Body() negotiationPostData: ChargingStationNegotiationPostDataDto,
  ): Promise<ChargingStationNegotiationDetailDto> {
    const { negotiation_id, hour_capacities } = negotiationPostData;
    const negotiation =
      await this.availableCapacityNegotiationService.getNegotiationById(
        negotiation_id,
      );

    if (negotiation.lastDetailStatus !== NegotiationStatus.EXTRA_REPLY_EDIT) {
      throw new ForbiddenException(
        `Negotiation with id ${negotiation_id} is not in extra reply edit status`,
      );
    }

    const negotiationDetail =
      await this.availableCapacityNegotiationService.updateExtraReplyNegotiation(
        negotiation_id,
        hour_capacities as { hour: number; capacity: number }[],
      );

    return {
      id: negotiationDetail.id,
      status: negotiationDetail.status,
      hour_capacities: negotiationDetail.hourCapacities,
      created_at: negotiationDetail.createdAt,
    };
  }

  @Post('/negotiation/confirm-extra-reply')
  @HttpCode(HttpStatus.OK)
  async confirmExtraReplyNegotiation(
    @Body()
    negotiationConfirmPostData: ChargingStationNegotiationConfirmPostDataDto,
  ): Promise<object> {
    const { negotiation_id } = negotiationConfirmPostData;
    const negotiation =
      await this.availableCapacityNegotiationService.getNegotiationById(
        negotiation_id,
      );

    if (negotiation.lastDetailStatus !== NegotiationStatus.EXTRA_REPLY_EDIT) {
      throw new ForbiddenException(
        `Negotiation with id ${negotiation_id} is not in extra reply edit status`,
      );
    }

    await this.availableCapacityNegotiationService.replyExtraCapacity(
      negotiation_id,
    );

    return {};
  }
}

function findDetailByStatus(
  negotiationDetails: AvailableCapacityNegotiationDetailEntity[],
  status: NegotiationStatus,
): AvailableCapacityNegotiationDetailEntity | null {
  return negotiationDetails.find((detail) => detail.status === status) ?? null;
}

function buildNegotiationDetailDto(
  detail: AvailableCapacityNegotiationDetailEntity,
): ChargingStationNegotiationDetailDto {
  return {
    id: detail.id,
    status: detail.status,
    hour_capacities: detail.hourCapacities,
    created_at: detail.createdAt,
  };
}

function buildNegotiationEmergencyDto(
  emergency: AvailableCapacityEmergencyEntity,
): ChargingStationNegotiationEmergencyDto {
  return {
    id: emergency.id,
    period_start_at: emergency.periodStartAt,
    period_end_at: emergency.periodEndAt,
    capacity: emergency.capacity,
    is_success_sent: emergency.isSuccessSent,
    created_at: emergency.createdAt,
  };
}
