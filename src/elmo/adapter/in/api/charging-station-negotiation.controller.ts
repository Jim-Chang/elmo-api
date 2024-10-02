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
  UsePipes,
} from '@nestjs/common';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { ChargingStationService } from '../../../application/charging-station/charging-station.service';
import {
  ChargingStationNegotiationListDataDto,
  ChargingStationNegotiationListQueryDto,
} from './dto/charging-station-negotiation-list.dto';
import { DateTime } from 'luxon';
import { TAIPEI_TZ } from '../../../../constants';
import {
  ChargingStationNegotiationDetailDto,
  ChargingStationNegotiationDto,
  ChargingStationNegotiationPostDataDto,
} from './dto/charging-station-negotiation.dto';
import { AvailableCapacityNegotiationService } from '../../../application/available-capacity/available-capacity-negotiation.service';
import { AvailableCapacityNegotiationDetailEntity } from '../../out/entities/available-capacity-negotiation-detail.entity';
import { NegotiationStatus } from '../../../application/available-capacity/types';

@Controller('/api/charging-station-negotiation')
@UsePipes(ZodValidationPipe)
export class ChargingStationNegotiationController {
  private logger = new Logger(ChargingStationNegotiationController.name);

  constructor(
    private chargingStationService: ChargingStationService,
    private availableCapacityNegotiationService: AvailableCapacityNegotiationService,
  ) {}

  @Get()
  async getListItems(
    @Query() query: ChargingStationNegotiationListQueryDto,
  ): Promise<ChargingStationNegotiationListDataDto> {
    const filterBy = {
      date: DateTime.fromFormat(query.date, 'yyyy-MM-dd', {
        zone: TAIPEI_TZ,
      }).toJSDate(),
      districtId: query.district_id,
      feedLineId: query.feed_line_id,
      loadSiteId: query.load_site_id,
      negotiationStatusList: query.negotiation_status,
      keyword: query.keyword,
    };

    const chargingStations =
      await this.chargingStationService.findChargingStationWithNegotiation(
        filterBy,
      );

    const itemDataList = chargingStations.map((chargingStation) => ({
      negotiation_id: chargingStation.negotiations[0]?.id ?? null,
      feed_line: chargingStation.feedLine?.name ?? null,
      electricity_account_no: chargingStation.electricityAccountNo ?? null,
      charging_station_name: chargingStation.name,
      load_site_name: chargingStation.loadSite?.name ?? null,
      negotiation_status:
        chargingStation.negotiations[0]?.lastDetailStatus ?? null,
    }));

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
      NegotiationStatus.INITIAL_EDIT,
    );

    const requestDetail = findDetailByStatus(
      negotiationDetails,
      NegotiationStatus.EXTRA_REQUEST,
    );

    const replyEditDetail = findDetailByStatus(
      negotiationDetails,
      NegotiationStatus.EXTRA_REPLY_EDIT,
    );

    const replyDetail =
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

    return {
      charging_station: {
        name: chargingStation.name,
        contract_capacity: chargingStation.contractCapacity,
      },
      negotiation_id: negotiation.id,
      date: negotiation.date,
      initial_detail: buildNegotiationDetailDto(initialDetail),
      request_detail: requestDetail
        ? buildNegotiationDetailDto(requestDetail)
        : null,
      reply_edit_detail: replyEditDetail
        ? buildNegotiationDetailDto(replyEditDetail)
        : null,
      reply_detail: replyDetail ? buildNegotiationDetailDto(replyDetail) : null,
      last_status: negotiation.lastDetailStatus,
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
