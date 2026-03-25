import type { Passenger, Reservation, Trip } from '../types';
import { getAuthToken } from '../auth/token';

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

interface TripSeatsResponse {
  tripId: string;
  totalSeats: number;
  takenSeats: number[];
  availableSeats: number;
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

const requestWithAuth = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('No hay sesion activa para administrador.');
  }

  return request<T>(path, {
    ...(options ?? {}),
    headers: {
      ...(options?.headers ?? {}),
      Authorization: `Bearer ${token}`
    }
  });
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

  async getTripSeats(tripId: string) {
    return request<TripSeatsResponse>(`/api/trips/${encodeURIComponent(tripId)}/seats`);
  },

  async getReservationsByEmail(email: string) {
    return request<ReservationsResponse>(`/api/reservations?email=${encodeURIComponent(email)}`);
  },

  async getAdminReservations() {
    return requestWithAuth<ReservationsResponse>('/api/admin/reservations');
  },

  async createReservation(payload: ReservePayload) {
    return request<{ reservation: Reservation }>('/api/reservations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async deleteReservation(id: string) {
    return request<{ message: string }>(`/api/reservations/${id}`, {
      method: 'DELETE'
    });
  }
};
