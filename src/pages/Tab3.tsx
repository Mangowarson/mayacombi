import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar
} from '@ionic/react';
import type { Reservation, Trip } from '../types';
import './Tab3.css';

interface Tab3Props {
  trips: Trip[];
  reservationsByTrip: Record<string, Reservation[]>;
  apiError: string;
  onReload: () => Promise<void>;
}

const Tab3: React.FC<Tab3Props> = ({ trips, reservationsByTrip, apiError, onReload }) => {
  const totalReservations = Object.values(reservationsByTrip).reduce((acc, group) => acc + group.length, 0);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Panel Admin</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Resumen operativo</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Reservas confirmadas: {totalReservations}</p>
            <p>Rutas y horarios administrables: {trips.length}</p>
            <IonButton size="small" onClick={() => void onReload()}>
              Actualizar datos
            </IonButton>
            {apiError && <IonText color="danger">{apiError}</IonText>}
          </IonCardContent>
        </IonCard>

        {trips.map((trip) => {
          const tripReservations = reservationsByTrip[trip.id] ?? [];

          return (
            <IonCard key={trip.id}>
              <IonCardHeader>
                <IonCardTitle>
                  {trip.route} - {trip.time}
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p>Pasajeros asignados: {tripReservations.length}</p>
                <IonList>
                  {tripReservations.length === 0 && (
                    <IonItem>
                      <IonLabel>No hay reservas confirmadas en este viaje.</IonLabel>
                    </IonItem>
                  )}
                  {tripReservations.map((reservation) => (
                    <IonItem key={reservation.id}>
                      <IonLabel>
                        {reservation.passengerName} - Asiento {reservation.seatNumber}
                      </IonLabel>
                    </IonItem>
                  ))}
                </IonList>
              </IonCardContent>
            </IonCard>
          );
        })}
      </IonContent>
    </IonPage>
  );
};

export default Tab3;
