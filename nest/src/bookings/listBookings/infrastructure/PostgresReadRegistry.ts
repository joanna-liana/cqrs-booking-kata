import { EntityRepository } from '@mikro-orm/postgresql';

import { BookingReadModel } from '../domain/BookingReadModel';
import { BookingReadRegistry } from '../domain/BookingReadRegistry';
import { BookingRead } from './BookingRead.entity';

export class PostgresReadRegistry implements BookingReadRegistry {
  constructor(private readonly repo: EntityRepository<BookingRead>) {}

  getAll(): Promise<BookingReadModel[]> {
    return this.repo.findAll();
  }

  async add(booking: BookingReadModel): Promise<void> {
    const entity = this.repo.create(booking);

    await this.repo.persistAndFlush(entity);
  }
}
