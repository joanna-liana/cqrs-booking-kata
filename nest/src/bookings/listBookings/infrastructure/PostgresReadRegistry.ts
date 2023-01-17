import { BookingReadModel } from '../domain/BookingReadModel';
import { BookingReadRegistry } from '../domain/BookingReadRegistry';
import { BookingRead } from './BookingRead.entity';
import { Inject } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';

export class PostgresReadRegistry implements BookingReadRegistry {
  constructor(
    @Inject(MikroORM)
    private readonly orm: MikroORM,
  ) {}

  private get repo() {
    return this.orm.em.fork().getRepository(BookingRead);
  }

  getAll(): Promise<BookingReadModel[]> {
    return this.repo.findAll();
  }

  async add(booking: BookingReadModel): Promise<void> {
    const entity = this.repo.create(booking);

    await this.repo.persistAndFlush(entity);
  }
}
