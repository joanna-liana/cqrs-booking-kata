import axios from 'axios';
import { Response } from 'express';
import { Server } from 'http';

import { getApp } from '../../../src/app';
import { ROOM_ONE_NAME } from '../../../src/bookings/rooms';

describe('Book a room use case', () => {
  let server: Server;
  const PORT = 3335;

  const ANY_CLIENT_ID = 'client1';
  const ROOM_TO_BOOK_NAME = ROOM_ONE_NAME;

  const ARRIVAL_DATE = new Date(2020, 1, 5);
  const DEPARTURE_DATE = new Date(2020, 1, 9);

  beforeAll(() => {
    const app = getApp();

    server = app.listen(PORT);
  });

  afterAll(() => {
    server.close();
  });

  it('books a free room in the given period', async () => {
    // given
    // TODO: app started on a random port, once, before all specs
    const TEST_BASE_URL = `http://localhost:${PORT}/bookings`;

    // when
    const { status } = await bookRoom();

    // then
    expect(status).toBe(201);

    const { status: duplicatedBookingStatus } = await bookRoom();
    expect(duplicatedBookingStatus).toBe(409);

    async function bookRoom(): Promise<Response> {
      return axios.post(
        TEST_BASE_URL,
        {
          clientId: ANY_CLIENT_ID,
          room: ROOM_TO_BOOK_NAME,
          arrival: ARRIVAL_DATE,
          departure: DEPARTURE_DATE
        },
        {
          validateStatus: _status => true
        }
      );
    }
  });
});
