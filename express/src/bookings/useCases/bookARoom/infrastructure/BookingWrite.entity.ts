import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core';

import { BookingWriteModel } from '../domain/BookingWriteModel';

// TODO: horrible name to be changed / "read" entity to be removed
@Entity()
@Unique({
  properties: ['roomName', 'arrivalDate', 'departureDate']
})
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
