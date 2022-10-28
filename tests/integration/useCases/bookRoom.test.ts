import axios from 'axios';

import { ROOM_ONE_NAME } from '../../../src/rooms';

describe('Book a room use case', () => {
  const ANY_CLIENT_ID = 'client1';
  const ROOM_TO_BOOK_NAME = ROOM_ONE_NAME;

  const ARRIVAL_DATE = new Date(2020, 1, 5);
  const DEPARTURE_DATE = new Date(2020, 1, 9);

  it('books a free room in the given period', async () => {
    // given
    // TODO: app started on a random port, once, before all specs
    const TEST_BASE_URL = 'http://localhost:3333/bookings';

    async function bookRoom(): Promise<void> {
      await axios.post(TEST_BASE_URL, {
        clientId: ANY_CLIENT_ID,
        room: ROOM_TO_BOOK_NAME,
        arrival: ARRIVAL_DATE,
        departure: DEPARTURE_DATE
      });
    }

    // when
    await bookRoom();

    // then
    await expect(() => bookRoom()).rejects.toBeTruthy();


  });
});
