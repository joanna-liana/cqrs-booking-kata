import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { BookingWriteModel } from './BookingCommandHandler';

// TODO: horrible name to be changed / "read" entity to be removed
@Entity()
export class BookingWrite implements BookingWriteModel {
  @PrimaryKey()
  id!: number;

  @Property()
  clientId: string;

  @Property()
  roomName: string;

  @Property()
  arrivalDate: Date;

  @Property()
  departureDate: Date;
}
