import {
  Body,
  Controller,
  Delete,
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
import { ZodValidationPipe } from '@anatine/zod-nestjs';

@Controller('oscp/2.0')
@UsePipes(ZodValidationPipe)
export class OscpController {
  private logger = new Logger(OscpController.name);

  @Post('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log(
      `[Received request]: /register POST, body: ${JSON.stringify(registerDto)}`,
    );
  }

  @Put('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateRegister(@Body() registerDto: RegisterDto) {
    this.logger.log(
      `[Received request]: /register PUT, body: ${JSON.stringify(registerDto)}`,
    );
  }

  @Delete('register')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRegister(@Body() registerDto: RegisterDto) {
    this.logger.log(
      `[Received request]: /register DELETE, body: ${JSON.stringify(registerDto)}`,
    );
  }

  @Post('handshake_acknowledge')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handshakeAcknowledge(
    @Body() handshakeDto: HandshakeDto,
  ): Promise<void> {
    this.logger.log(
      `[Received request]: /handshake_acknowledge POST, body: ${JSON.stringify(handshakeDto)}`,
    );
  }

  @Post('group_capacity_compliance_error')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handleGroupCapacityComplianceError(
    @Body() groupCapacityComplianceErrorDto: GroupCapacityComplianceErrorDto,
  ): Promise<void> {
    this.logger.log(
      `[Received request]: /group_capacity_compliance_error POST, body: ${JSON.stringify(groupCapacityComplianceErrorDto)}`,
    );
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
  }
}
