import type { Passenger, Reservation, Trip } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';

interface LoginResponse {
  passenger: Passenger;
}

interface ReservationsResponse {
  reservations: Reservation[];
}

interface TripsResponse {
  trips: Trip[];
}

interface ReservePayload {
  passengerName: string;
  passengerEmail: string;
  tripId: string;
  seatNumber: number;
  paid: boolean;
}

const parseErrorMessage = async (response: Response) => {
  try {
    const body = await response.json();
    return body.message ?? 'Ocurrio un error en el servidor.';
  } catch {
    return 'Ocurrio un error en el servidor.';
  }
};

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  return response.json() as Promise<T>;
};

export const api = {
  async login(payload: Passenger) {
    return request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getTrips() {
    return request<TripsResponse>('/api/trips');
  },

  async getReservations() {
    return request<ReservationsResponse>('/api/reservations');
  },

  async createReservation(payload: ReservePayload) {
    return request<{ reservation: Reservation }>('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
