import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RmqOptions } from '@nestjs/microservices';
import { getRabbitConfig } from './bookings/shared/infrastructure/RabbitConfig';
import { MikroORM } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await setUpDatabase(app);

  app.connectMicroservice<RmqOptions>(getRabbitConfig());

  await app.startAllMicroservices();

  await app.listen(3000);
}

bootstrap();

async function setUpDatabase(app: INestApplication) {
  const orm = app.get(MikroORM);
  const generator = orm.getSchemaGenerator();

  await generator.ensureDatabase();
  await generator.updateSchema();
}
