import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import * as dotenv from 'dotenv';

dotenv.config();

export interface DbConfig {
  name?: string;
}

export async function setUpOrm(
  config?: DbConfig
): Promise<MikroORM<PostgreSqlDriver>> {
  const orm = await MikroORM.init<PostgreSqlDriver>({
    entities: ['./build/**/*.entity.js'],
    entitiesTs: ['./src/**/*.entity.ts'],
    dbName: config?.name ?? 'cqrs_booking_kata',
    type: 'postgresql',
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT)
  });

  const generator = orm.getSchemaGenerator();

  await generator.ensureDatabase();
  await generator.updateSchema();

  return orm;
}
