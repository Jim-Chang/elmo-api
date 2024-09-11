import amqp, {
  AmqpConnectionManager,
  ChannelWrapper,
} from 'amqp-connection-manager';
import { Logger } from '@nestjs/common';

export class MqTopicPublishHelper {
  private static urlToConnectionMap: Record<string, AmqpConnectionManager> = {};
  private readonly logger = new Logger('MqTopicPublishHelper');

  constructor(private url: string) {}

  private static getConnection(url: string): AmqpConnectionManager {
    if (!this.urlToConnectionMap[url]) {
      this.urlToConnectionMap[url] = amqp.connect(url);
    }
    const connection = this.urlToConnectionMap[url];
    if (!connection.isConnected()) {
      connection.reconnect();
    }

    return connection;
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

  private async createChannel(exchange: string): Promise<ChannelWrapper> {
    const connection = MqTopicPublishHelper.getConnection(this.url);
    const channel = connection.createChannel();
    await channel.assertExchange(exchange, 'topic', { durable: true });
    return channel;
  }
}
