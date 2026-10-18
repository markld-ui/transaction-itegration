import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { PostgresConnectionCredentialsOptions } from 'typeorm/driver/postgres/PostgresConnectionCredentialsOptions.js';
import migrations from './migrations/index.js';

export const databaseOptions = (
  config: ConfigService,
): TypeOrmModuleOptions & PostgresConnectionCredentialsOptions => ({
  type: 'postgres',
  host: config.get('DB_HOST'),
  port: Number(config.get('DB_PORT')),
  username: config.get('DB_USERNAME'),
  password: config.get('DB_PASSWORD'),
  database: config.get('DB_DATABASE'),
  logging: config.get('DB_LOGGING') === 'true',
  synchronize: false,
  migrationsRun: config.get('DB_MIGRATIONS_RUN') === 'true',
  migrationsTableName: config.get('DB_MIGRATIONS_TABLE_NAME', 'database_migrations'),
  migrations,
  autoLoadEntities: true,
});
