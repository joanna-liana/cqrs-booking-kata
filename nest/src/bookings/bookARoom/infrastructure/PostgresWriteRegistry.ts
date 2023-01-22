import { EntityRepository } from '@mikro-orm/postgresql';

import { BookingWriteModel } from '../domain/BookingWriteModel';
import { BookingWriteRegistry } from '../domain/BookingWriteRegistry';
import { BookingWrite } from './BookingWrite.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PostgresWriteRegistry implements BookingWriteRegistry {
  constructor(
    @InjectRepository(BookingWrite)
    private readonly repo: EntityRepository<BookingWrite>,
  ) {}

  async makeABooking(booking: BookingWriteModel): Promise<void> {
    const entity = this.repo.create(booking);

    await this.repo.persistAndFlush(entity);
  }

  getRoomBookings(roomName: string): Promise<BookingWriteModel[]> {
    return this.repo.find({
      roomName,
    });
  }
}
