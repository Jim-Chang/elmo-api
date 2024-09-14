import amqp, {
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MQConfig } from '../../../../config/mq.config';
import { ChargingStationMeasureData } from '../../../application/charging-station/types';

@Injectable()
export class MqTopicPublishHelper {
  private readonly logger = new Logger('MqTopicPublishHelper');
  private readonly mqConfig: MQConfig;

  constructor(private readonly configService: ConfigService) {
    this.mqConfig = this.configService.get<MQConfig>('mq');
  }

  private static _connection: AmqpConnectionManager;

  private get connection(): AmqpConnectionManager {
    if (!MqTopicPublishHelper._connection) {
      // SSL Ref: https://amqp-node.github.io/amqplib/ssl.html
      MqTopicPublishHelper._connection = amqp.connect(this.mqUrl, {
        connectionOptions: {
          enableTrace: true,
          requestCert: true,
          rejectUnauthorized: false, // Disable automatic rejection of self-signed certificates
          checkServerIdentity: () => undefined, // Disable hostname verification
          ca: this.mqConfig.caCert, // Use self-signed CA certificate
          cert: this.mqConfig.clientCert, // Use client certificate
          key: this.mqConfig.clientKey, // Use client key
        },
      });
    }
    if (!MqTopicPublishHelper._connection.isConnected()) {
      MqTopicPublishHelper._connection.reconnect();
    }
    return MqTopicPublishHelper._connection;
  }

  private get mqUrl(): string {
    const { user, password, host, port } = this.mqConfig;
    return `amqps://${user}:${password}@${host}:${port}`;
  }

  async publish(exchange: string, routingKey: string, message: any) {
    const channel = await this.createChannel(exchange);
    try {
      await channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish message to MQ, exchange[${exchange}], routingKey[${routingKey}], Error Message: ${error.message}`,
      );
    }
    await channel.close();
  }

  async publishToChargingStationExchange(data: ChargingStationMeasureData) {
    await this.publish(this.mqConfig.chargingStationExchange, '', data);
  }

  private async createChannel(exchange: string): Promise<ChannelWrapper> {
    const channel = this.connection.createChannel();
    await channel.assertExchange(exchange, 'topic', { durable: true });
    return channel;
  }
}
