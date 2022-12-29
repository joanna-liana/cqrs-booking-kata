import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  console.log('process.env.RABBIT_PORT', process.env.RABBIT_PORT);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [`amqp://localhost:${process.env.RABBIT_PORT}`],
      queue: 'bookings',
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.listen(3000);
}
bootstrap();
