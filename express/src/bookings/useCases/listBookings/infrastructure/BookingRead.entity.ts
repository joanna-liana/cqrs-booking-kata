import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { BookingReadModel } from '../domain/BookingReadModel';

// TODO: horrible name to be changed / "read" entity to be removed
@Entity()
export class BookingRead implements BookingReadModel {
  @PrimaryKey()
  id!: number;

  @Property()
  roomName: string;

  @Property()
  arrivalDate: Date;

  @Property()
  departureDate: Date;
}
