import axios from 'axios';
import { Response } from 'express';

import { ROOM_ONE_NAME } from '../../../src/bookings/shared/domain/rooms';

describe('Book a room use case', () => {
  let testUrl: string;

  const ANY_CLIENT_ID = 'client1';
  const ROOM_TO_BOOK_NAME = ROOM_ONE_NAME;

  const ARRIVAL_DATE = new Date(2020, 1, 5);
  const DEPARTURE_DATE = new Date(2020, 1, 9);

  beforeAll(() => {
    testUrl = `${global.baseTestUrl}/bookings`;
  });

  async function bookRoom(): Promise<Response> {
    return axios.post(
      testUrl,
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

  it('books a free room in the given period', async () => {
    // when
    const { status } = await bookRoom();

    // then
    expect(status).toBe(201);

    const { status: duplicatedBookingStatus } = await bookRoom();
    expect(duplicatedBookingStatus).toBe(409);
  });
});
