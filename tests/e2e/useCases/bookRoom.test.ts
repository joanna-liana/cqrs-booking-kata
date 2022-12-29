import axios, { AxiosResponse } from 'axios';
import { Response } from 'express';

describe('Book a room use case', () => {
  let testUrl: string;

  const ANY_CLIENT_ID = 'client1';
  const ROOM_TO_BOOK_NAME = 'Room 1';

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

  async function expectUpdatedRoomListing() {
    async function listRooms(): Promise<AxiosResponse> {
      return axios.get<{ data: unknown }>(
        testUrl,
        {
          params: {
            arrival: ARRIVAL_DATE,
            departure: DEPARTURE_DATE
          }
        }
      );
    }

    await new Promise(resolve => {
      setTimeout(() => resolve(null), 2000)
    });

    const { data: { data } } = await listRooms();

    expect(data).toEqual(
      expect.not.arrayContaining([{
        name: ROOM_TO_BOOK_NAME
      }])
    );
  }


  it('books a free room in the given period', async () => {
    // when
    const { status } = await bookRoom();

    // then
    expect(status).toBe(201);

    const { status: duplicatedBookingStatus } = await bookRoom();
    expect(duplicatedBookingStatus).toBe(409);

    await expectUpdatedRoomListing();
  });
});
