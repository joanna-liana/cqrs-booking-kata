import { RmqOptions, Transport } from '@nestjs/microservices';

export const RabbitConfig: RmqOptions = {
  transport: Transport.RMQ,
  options: {
    urls: [`amqp://localhost:${process.env.RABBIT_PORT}`],
    queue: 'bookings',
    queueOptions: {
      durable: true,
    },
  },
};
