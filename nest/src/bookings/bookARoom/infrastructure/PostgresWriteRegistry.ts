import { EntityRepository } from '@mikro-orm/postgresql';

import { BookingWriteModel } from '../domain/BookingWriteModel';
import { BookingWriteRegistry } from '../domain/BookingWriteRegistry';
import { BookingWrite } from './BookingWrite.entity';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Inject } from '@nestjs/common';

export class PostgresWriteRegistry implements BookingWriteRegistry {
  constructor(
    @Inject(getRepositoryToken(BookingWrite))
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
