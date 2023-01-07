import { Injectable } from '@nestjs/common';

@Injectable()
export class MyLibraryService {
  exec(): void {
    console.log('HELLO FROM LIBRARY!');
  }
}
