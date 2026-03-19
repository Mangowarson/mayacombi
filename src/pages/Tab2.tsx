import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
  IonChip,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
  useIonToast
} from '@ionic/react';
import { useMemo, useState } from 'react';
import type { Passenger, Reservation, Trip } from '../types';
import './Tab2.css';

interface Tab2Props {
  activePassenger: Passenger;
  trips: Trip[];
  reservations: Reservation[];
  onReserve: (payload: Omit<Reservation, 'id' | 'createdAt'>) => Promise<Reservation>;
  onReload: () => Promise<void>;
  apiError: string;
}

const Tab2: React.FC<Tab2Props> = ({ activePassenger, trips, reservations, onReserve, onReload, apiError }) => {
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [ticketMessage, setTicketMessage] = useState('');
  const [present] = useIonToast();

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) ?? trips[0];

  const tripIdForSeats = selectedTrip?.id ?? '';

  const takenSeats = useMemo(() => {
    return reservations
      .filter((reservation) => reservation.tripId === tripIdForSeats)
      .map((reservation) => reservation.seatNumber);
  }, [reservations, tripIdForSeats]);

  const seatNumbers = useMemo(() => {
    const totalSeats = selectedTrip?.seats ?? 0;
    return Array.from({ length: totalSeats }, (_, index) => index + 1);
  }, [selectedTrip]);

  const availableSeats = seatNumbers.length - takenSeats.length;

  const handleReserve = async () => {
    if (!activePassenger.name || !activePassenger.email) {
      present({ message: 'Primero inicia sesion en Inicio.', duration: 1600, color: 'warning' });
      return;
    }

    if (!selectedTrip || !selectedSeat) {
      present({ message: 'Selecciona viaje y asiento.', duration: 1600, color: 'warning' });
      return;
    }

    try {
      const reservation = await onReserve({
        passengerName: activePassenger.name,
        passengerEmail: activePassenger.email,
        tripId: selectedTrip.id,
        seatNumber: selectedSeat,
        paid: paymentConfirmed
      });

      setTicketMessage(
        `Boleto ${reservation.id}: ${selectedTrip.route} ${selectedTrip.time}, asiento ${selectedSeat}, pasajero ${activePassenger.name}.`
      );
      setPaymentConfirmed(false);
      present({ message: 'Reserva confirmada y boleto generado.', duration: 1800, color: 'success' });
    } catch (error) {
      present({ message: error instanceof Error ? error.message : 'Error al reservar.', duration: 1800, color: 'danger' });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Reservar Boleto</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Seleccion de viaje</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel>Viaje</IonLabel>
              <IonSelect value={selectedTripId || selectedTrip?.id} onIonChange={(e) => setSelectedTripId(e.detail.value)}>
                {trips.map((trip) => (
                  <IonSelectOption key={trip.id} value={trip.id}>
                    {trip.route} - {trip.time} (${trip.price})
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <div className="status-row">
              <IonChip color="primary">
                <IonLabel>Disponibles: {availableSeats}</IonLabel>
              </IonChip>
              <IonChip color="medium">
                <IonLabel>Ocupados: {takenSeats.length}</IonLabel>
              </IonChip>
              <IonButton size="small" fill="clear" onClick={() => void onReload()}>
                Recargar
              </IonButton>
            </div>

            <div className="seat-grid">
              {seatNumbers.map((seat) => {
                const taken = takenSeats.includes(seat);
                const selected = selectedSeat === seat;
                return (
                  <IonButton
                    key={seat}
                    size="small"
                    fill={selected ? 'solid' : 'outline'}
                    color={taken ? 'medium' : selected ? 'success' : 'primary'}
                    disabled={taken}
                    onClick={() => setSelectedSeat(seat)}
                  >
                    {seat}
                  </IonButton>
                );
              })}
            </div>

            <IonItem lines="none" className="payment-item">
              <IonCheckbox checked={paymentConfirmed} onIonChange={(e) => setPaymentConfirmed(e.detail.checked)}>
                Confirmar pago del boleto
              </IonCheckbox>
            </IonItem>

            <IonButton expand="block" onClick={handleReserve}>
              Confirmar reserva
            </IonButton>
            {apiError && <IonText color="danger">{apiError}</IonText>}
          </IonCardContent>
        </IonCard>

        {ticketMessage && (
          <IonCard color="light">
            <IonCardHeader>
              <IonCardTitle>Boleto digital</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText>{ticketMessage}</IonText>
              <p>
                <IonBadge color="success">Pago validado</IonBadge>
              </p>
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
