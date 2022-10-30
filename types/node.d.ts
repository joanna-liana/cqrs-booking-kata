// To make global types work:
/* eslint-disable no-var */
import { Server } from 'http';

declare global {
  var server: Server;
  var baseTestUrl: string;
}
