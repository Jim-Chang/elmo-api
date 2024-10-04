import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Put,
  UsePipes,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { HandshakeDto } from './dto/handshake.dto';
import { GroupCapacityComplianceErrorDto } from './dto/group-capacity-compliance-error.dto';
import { AdjustGroupCapacityForecastDto } from './dto/adjust-group-capacity-forecast.dto';
import { OSCP_API_PREFIX, OSCP_API_VERSION } from '../../../../constants';
import { ZodValidationPipe } from '@anatine/zod-nestjs';
import { UpdateGroupMeasurementsDto } from './dto/update-group-measurements.dto';
import { AvailableCapacityNegotiationService } from '../../../application/available-capacity/available-capacity-negotiation.service';
import { ChargingStationService } from '../../../application/charging-station/charging-station.service';
import { transformNegotiationForecastedBlocksToHourCapacities } from './oscp.helper';
import { CsmsService } from '../../../application/csms/csms.service';
import { CsmsId } from '../decorator/csms-id';
import { CsmsOscpRequestHelper } from '../../out/csms-oscp/csms-oscp-request-helper';
import { MeasurementConfiguration } from './dto/enums';

@Controller(OSCP_API_PREFIX)
@UsePipes(ZodValidationPipe)
export class OscpController {
  private logger = new Logger(OscpController.name);

  constructor(
    private readonly availableCapacityNegotiationService: AvailableCapacityNegotiationService,
    private readonly chargingStationService: ChargingStationService,
    private readonly csmsService: CsmsService,
    private readonly csmsOscpRequestHelper: CsmsOscpRequestHelper,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(@CsmsId() csmsId: number, @Body() registerDto: RegisterDto) {
    this.logger.log(
      `[Received request]: /register POST, body: ${JSON.stringify(registerDto)}`,
    );

    // do jobs immediately after return 204
    setImmediate(async () => {
      // register csms
      const oscpToken = registerDto.token;
      const baseUrl = registerDto.version_url[0].base_url;
      await this.csmsService.register(csmsId, oscpToken, baseUrl);

      // send register back
      const csmsEntity = await this.csmsService.findById(csmsId);
      const token = await this.csmsService.generateAndSaveOscpElmoToken(csmsId);
      const backRegisterDto = buildRegisterDto(token);
      await this.csmsOscpRequestHelper.sendRegisterToCsms(
        csmsEntity,
        backRegisterDto,
      );

      // do handshake after send register back in 5 seconds
      setTimeout(async () => {
        const handshakeDto = buildHandshakeDto();
        await this.csmsOscpRequestHelper.sendHandshakeToCsms(
          csmsEntity,
          handshakeDto,
        );
        await this.csmsService.setSentHandshake(csmsId);
      }, 5000);
    });
  }

  @Put('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateRegister(
    @CsmsId() csmsId: number,
    @Body() registerDto: RegisterDto,
  ) {
    this.logger.log(
      `[Received request]: /register PUT, body: ${JSON.stringify(registerDto)}`,
    );

    // do jobs immediately after return 204
    setImmediate(async () => {
      const oscpToken = registerDto.token;
      const baseUrl = registerDto.version_url[0].base_url;
      await this.csmsService.register(csmsId, oscpToken, baseUrl);
    });
  }

  @Delete('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRegister(
    @CsmsId() csmsId: number,
    @Body() registerDto: RegisterDto,
  ) {
    this.logger.log(
      `[Received request]: /register DELETE, body: ${JSON.stringify(registerDto)}`,
    );

    // do jobs immediately after return 204
    setImmediate(async () => {
      await this.csmsService.unregister(csmsId);
    });
  }

  @Post('handshake_acknowledge')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handshakeAcknowledge(
    @CsmsId() csmsId: number,
    @Body() handshakeDto: HandshakeDto,
    @Headers('x-correlation-id') correlationId: string,
  ): Promise<void> {
    this.logger.log(
      `[Received request]: /handshake_acknowledge POST, body: ${JSON.stringify(handshakeDto)}`,
    );

    if (!correlationId) {
      this.logger.error(
        '[Received request]: /handshake_acknowledge POST, missing x-correlation-id',
      );
      throw new BadRequestException('Missing x-correlation-id header');
    }

    await this.csmsService.setConnected(csmsId);
  }

  @Post('group_capacity_compliance_error')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handleGroupCapacityComplianceError(
    @Body() groupCapacityComplianceErrorDto: GroupCapacityComplianceErrorDto,
    @Headers('x-correlation-id') correlationId: string,
  ): Promise<void> {
    this.logger.log(
      `[Received request]: /group_capacity_compliance_error POST, body: ${JSON.stringify(groupCapacityComplianceErrorDto)}`,
    );

    if (!correlationId) {
      this.logger.error(
        '[Received request]: /group_capacity_compliance_error POST, missing x-correlation-id',
      );
      throw new BadRequestException('Missing x-correlation-id header');
    }
  }

  @Post('adjust_group_capacity_forecast')
  @HttpCode(HttpStatus.NO_CONTENT)
  async adjustGroupCapacityForecast(
    @Body()
    adjustGroupCapacityForecastDto: AdjustGroupCapacityForecastDto,
  ): Promise<void> {
    this.logger.log(
      `[Received request]: /adjust_group_capacity_forecast POST, body: ${JSON.stringify(
        adjustGroupCapacityForecastDto,
      )}`,
    );

    const chargingStationUid = adjustGroupCapacityForecastDto.group_id;
    const hourCapacities = transformNegotiationForecastedBlocksToHourCapacities(
      adjustGroupCapacityForecastDto.forecasted_blocks,
    );

    await this.availableCapacityNegotiationService.requestExtraCapacity(
      chargingStationUid,
      hourCapacities,
    );
  }

  @Post('update_group_measurements')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateGroupMeasurements(
    @Body() updateGroupMeasurementsDto: UpdateGroupMeasurementsDto,
  ) {
    this.logger.log(
      `[Received request]: /update_group_measurements POST, body: ${JSON.stringify(updateGroupMeasurementsDto)}`,
    );
    const isChargingStationExist =
      await this.chargingStationService.isChargingStationExist(
        updateGroupMeasurementsDto.group_id,
      );

    if (!isChargingStationExist) {
      throw new BadRequestException(
        `Charging station with uid ${updateGroupMeasurementsDto.group_id} does not exist`,
      );
    }

    await this.chargingStationService.publishChargingStationMeasurements(
      updateGroupMeasurementsDto,
    );
  }
}

function buildRegisterDto(token: string): RegisterDto {
  return {
    token,
    version_url: [
      {
        base_url: OSCP_API_PREFIX,
        version: OSCP_API_VERSION,
      },
    ],
  };
}

function buildHandshakeDto(): HandshakeDto {
  return {
    required_behaviour: {
      measurement_configuration: [MeasurementConfiguration.Continuous],
    },
  };
}
