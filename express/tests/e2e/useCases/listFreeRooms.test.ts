import axios, { AxiosResponse } from 'axios';

describe('List free rooms use case', () => {
  let testUrl: string;

  const ARRIVAL_DATE = new Date(2020, 1, 5);
  const DEPARTURE_DATE = new Date(2020, 1, 9);

  beforeAll(() => {
    testUrl = `${global.baseTestUrl}/bookings`;
  });

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

  it('lists free rooms in the given period', async () => {
    // when
    const { status, data: { data } } = await listRooms();

    // then
    expect(status).toBe(200);
    expect(data).toEqual(
      expect.arrayContaining([{
        name: expect.any(String)
      }])
    );
  });
});
