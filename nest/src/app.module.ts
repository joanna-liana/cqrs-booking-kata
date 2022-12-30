import { Module } from '@nestjs/common';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [BookingsModule],
})
export class AppModule {}
