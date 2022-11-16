// To make global types work:
/* eslint-disable no-var */
import { Server } from 'http';

import { RabbitInstance } from '../src/bookings/shared/infrastructure/rabbitMq';

declare global {
  var server: Server;
  var baseTestUrl: string;
  var rabbit: RabbitInstance;
}
