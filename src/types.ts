export interface Passenger {
  name: string;
  email: string;
}

export interface Trip {
  id: string;
  route: string;
  time: string;
  price: number;
  seats: number;
}

export interface Reservation {
  id: string;
  passengerName: string;
  passengerEmail: string;
  tripId: string;
  seatNumber: number;
  paid: boolean;
  createdAt: string;
}
