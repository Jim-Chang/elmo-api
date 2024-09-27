import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ProxyConfig } from '../../../../config/proxy.config';

@Injectable()
export class ProxyHelper {
  private readonly proxyConfig: ProxyConfig;

  constructor(private readonly configService: ConfigService) {
    this.proxyConfig = this.configService.get<ProxyConfig>('proxy');
  }

  getConfigForAxiosRequest(): any {
    if (!this.proxyConfig.url) {
      return {}; // No proxy
    }

    return {
      httpsAgent: new HttpsProxyAgent(this.proxyConfig.url),
    };
  }
}
