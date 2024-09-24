import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { firstValueFrom } from 'rxjs';
import {
  OSCP_REQUEST_ID_ALPHABET,
  OSCP_REQUEST_ID_LENGTH,
} from '../../../../constants';
import { CsmsEntity } from '../entities/csms.entity';
import {
  CsmsOscpRequestFailedError,
  UpdateGroupCapacityForecast,
} from '../../../application/oscp/types';

@Injectable()
export class CsmsOscpRequestHelper {
  private readonly logger = new Logger(CsmsOscpRequestHelper.name);

  constructor(private readonly httpService: HttpService) {}

  async sendUpdateGroupCapacityForecastToCsms(
    csms: CsmsEntity,
    message: UpdateGroupCapacityForecast,
  ) {
    if (!csms.isConnected) {
      this.logger.error(`CSMS[${csms.id}] is not connected.`);
      return;
    }

    const url = `${csms.oscpBaseUrl}${csms.oscpEndpoint}/update_group_capacity_forecast`;
    const config = this.generateRequestConfig(csms.oscpToken);

    try {
      await firstValueFrom(this.httpService.post(url, message, config));
    } catch (error) {
      this.logger.error(
        `CSMS[${csms.id}] update_group_capacity_forecast failed: ${error}`,
      );
      throw new CsmsOscpRequestFailedError(
        `CSMS[${csms.id}] update_group_capacity_forecast failed`,
      );
    }
  }

  private generateRequestConfig(token: string) {
    const requestId = this.generateOscpRequestId();

    return {
      headers: {
        Authorization: `Token ${token}`,
        'X-Request-ID': requestId,
      },
    };
  }

  private generateOscpRequestId(): string {
    const generateCustomNanoid = customAlphabet(OSCP_REQUEST_ID_ALPHABET);
    return generateCustomNanoid(OSCP_REQUEST_ID_LENGTH);
  }
}
