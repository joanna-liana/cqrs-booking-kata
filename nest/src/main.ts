import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RmqOptions } from '@nestjs/microservices';
import { RabbitConfig } from './bookings/shared/infrastructure/RabbitConfig';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('process.env.RABBIT_PORT', process.env.RABBIT_PORT);

  app.connectMicroservice<RmqOptions>(RabbitConfig);

  await app.startAllMicroservices();

  await app.listen(3000);
}
bootstrap();
