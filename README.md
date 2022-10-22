# CQRS booking kata

Source: https://codingdojo.org/kata/CQRS_Booking/

## Goal
We want to make a booking solution for one hotel.

The first 2 users stories are:
1. As a user I want to see all free rooms.
2. As a user I want to book a room.

They want to use the CQRS pattern. To do that, we will:
- have one command service with a function called `bookARoom(Booking)`
- call the `WriteRegistry`
- notify the `ReadRegistry` called by the query service with the function:
  `freeRooms(arrival: Date, departure: Date): Room[]`

The `Booking` struct contains:
- client id
- room name
- arrival date
- departure date

And the `Room` struct contains only:
- room name
