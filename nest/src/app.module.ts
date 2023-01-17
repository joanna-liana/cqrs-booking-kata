import { BookingsModule } from './bookings/bookings.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MikroOrmModule.forRoot({
      entities: ['./dist/**/*.entity.js'],
      entitiesTs: ['./src/**/*.entity.ts'],
      dbName: 'cqrs_booking_kata',
      type: 'postgresql',
      password: process.env.PG_PASSWORD,
      port: Number(process.env.PG_PORT),
    }),
    BookingsModule,
  ],
})
export class AppModule {}
