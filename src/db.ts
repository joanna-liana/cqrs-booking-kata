import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import * as dotenv from 'dotenv';

dotenv.config();

export async function setUpOrm(): Promise<MikroORM<PostgreSqlDriver>> {
  const orm = await MikroORM.init<PostgreSqlDriver>({
    entities: ['./build/**/*.entity.js'],
    entitiesTs: ['./src/**/*.entity.ts'],
    dbName: 'cqrs_booking_kata',
    type: 'postgresql',
    password: process.env.PG_PASSWORD,
    port: Number(process.env.PG_PORT)
  });

  const generator = orm.getSchemaGenerator();

  await generator.updateSchema();

  return orm;
}
