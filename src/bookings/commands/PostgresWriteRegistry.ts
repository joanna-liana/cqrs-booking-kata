import { EntityRepository } from '@mikro-orm/postgresql';

import {
  BookingWriteModel,
  BookingWriteRegistry
} from './BookingCommandHandler';
import { BookingWrite } from './BookingWrite.entity';

export class PostgresWriteRegistry implements BookingWriteRegistry {
  constructor(
    private readonly repo: EntityRepository<BookingWrite>
  ) {}

  async makeABooking(booking: BookingWriteModel): Promise<void> {
    const entity = this.repo.create(booking);

    await this.repo.persistAndFlush(entity);
  }

  getRoomBookings(roomName: string): Promise<BookingWriteModel[]> {
    return this.repo.find({
      roomName
    });
  }
}
