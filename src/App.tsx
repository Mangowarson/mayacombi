import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { homeOutline, settingsOutline, ticketOutline } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';
import { api } from './api/client';
import type { Passenger, Reservation, Trip } from './types';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const App: React.FC = () => {
  const [activePassenger, setActivePassenger] = useState<Passenger>(() => {
    const saved = localStorage.getItem('maya_passenger');
    return saved ? JSON.parse(saved) : { name: '', email: '' };
  });

  const [trips, setTrips] = useState<Trip[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [apiError, setApiError] = useState('');
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS ?? 'leobeni46@gmail.com')
    .split(',')
    .map((email: string) => email.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = !!activePassenger.email && adminEmails.includes(activePassenger.email.toLowerCase());

  const loadData = async () => {
    try {
      setApiError('');
      const [{ trips: apiTrips }, { reservations: apiReservations }] = await Promise.all([
        api.getTrips(),
        api.getReservations()
      ]);
      setTrips(apiTrips);
      setReservations(apiReservations);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'No se pudo cargar datos del servidor.');
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const loginPassenger = async (payload: Passenger) => {
    const { passenger } = await api.login(payload);
    setActivePassenger(passenger);
    localStorage.setItem('maya_passenger', JSON.stringify(passenger));
    return passenger;
  };

  const logoutPassenger = () => {
    setActivePassenger({ name: '', email: '' });
    localStorage.removeItem('maya_passenger');
  };

  const reserveSeat = async (payload: Omit<Reservation, 'id' | 'createdAt'>) => {
    const { reservation } = await api.createReservation(payload);
    setReservations((current) => [reservation, ...current]);
    return reservation;
  };

  const reservationsByTrip = useMemo(() => {
    return reservations.reduce<Record<string, Reservation[]>>((acc, reservation) => {
      if (!acc[reservation.tripId]) {
        acc[reservation.tripId] = [];
      }
      acc[reservation.tripId].push(reservation);
      return acc;
    }, {});
  }, [reservations]);

  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/inicio">
              <Tab1 activePassenger={activePassenger} onLogin={loginPassenger} onLogout={logoutPassenger} apiError={apiError} />
            </Route>
            <Route exact path="/reservar">
              <Tab2
                activePassenger={activePassenger}
                trips={trips}
                reservations={reservations}
                onReserve={reserveSeat}
                onReload={loadData}
                apiError={apiError}
              />
            </Route>
            <Route exact path="/admin">
              {isAdmin ? (
                <Tab3 trips={trips} reservationsByTrip={reservationsByTrip} apiError={apiError} onReload={loadData} />
              ) : (
                <Redirect to="/inicio" />
              )}
            </Route>
            <Route exact path="/">
              <Redirect to="/inicio" />
            </Route>
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="inicio" href="/inicio">
              <IonIcon aria-hidden="true" icon={homeOutline} />
              <IonLabel>Inicio</IonLabel>
            </IonTabButton>
            <IonTabButton tab="reservar" href="/reservar">
              <IonIcon aria-hidden="true" icon={ticketOutline} />
              <IonLabel>Reservar</IonLabel>
            </IonTabButton>
            {isAdmin && (
              <IonTabButton tab="admin" href="/admin">
                <IonIcon aria-hidden="true" icon={settingsOutline} />
                <IonLabel>Admin</IonLabel>
              </IonTabButton>
            )}
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
