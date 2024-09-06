import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs/typings';
import { Logger, NotFoundException } from '@nestjs/common';
import { ConfigModule, registerAs } from '@nestjs/config';
import { MySqlDriver } from '@mikro-orm/mysql';
import { getEnvPath } from './utils';

const logger = new Logger('MikroOrm');

export const mikroOrmConfig = registerAs(
  'mikroOrm',
  (): MikroOrmModuleSyncOptions => {
    const baseDir = __dirname + '/../';
    return {
      baseDir,
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT, 10),
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      dbName: process.env.DATABASE_NAME,
      driver: MySqlDriver,
      entities: [baseDir + './**/entities/*.entity.js'],
      entitiesTs: [baseDir + './**/entities/*.entity.ts'],
      migrations: {
        path: baseDir + './database/migrations',
      },
      seeder: {
        path: baseDir + './database/seeders',
      },
      forceUtcTimezone: true,
      autoLoadEntities: true,
      logger: logger.log.bind(console),
      findOneOrFailHandler: (entityName) => {
        return new NotFoundException(`${entityName} not found!`);
      },
    };
  },
);

export default (): MikroOrmModuleSyncOptions => {
  ConfigModule.forRoot({
    envFilePath: getEnvPath(),
  });
  return mikroOrmConfig();
};
