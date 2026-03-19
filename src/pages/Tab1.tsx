import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
  useIonToast
} from '@ionic/react';
import { useEffect, useState } from 'react';
import type { Passenger } from '../types';
import './Tab1.css';

interface Tab1Props {
  activePassenger: Passenger;
  onLogin: (passenger: Passenger) => Promise<Passenger>;
  apiError: string;
}

const Tab1: React.FC<Tab1Props> = ({ activePassenger, onLogin, apiError }) => {
  const [name, setName] = useState(activePassenger.name);
  const [email, setEmail] = useState(activePassenger.email);
  const [present] = useIonToast();

  useEffect(() => {
    setName(activePassenger.name);
    setEmail(activePassenger.email);
  }, [activePassenger]);

  const handleLogin = async () => {
    if (!name.trim() || !email.trim()) {
      present({ message: 'Completa nombre y correo.', duration: 1600, color: 'warning' });
      return;
    }

    try {
      await onLogin({ name: name.trim(), email: email.trim().toLowerCase() });
      present({ message: 'Sesion iniciada correctamente.', duration: 1600, color: 'success' });
    } catch (error) {
      present({ message: error instanceof Error ? error.message : 'Error de autenticacion.', duration: 1800, color: 'danger' });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>MayaCombi</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Acceso de pasajero</IonCardTitle>
            <IonCardSubtitle>Registro / inicio de sesion</IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Nombre completo</IonLabel>
              <IonInput value={name} placeholder="Leonardo Alvarez" onIonInput={(e) => setName(e.detail.value ?? '')} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">Correo</IonLabel>
              <IonInput
                type="email"
                value={email}
                placeholder="correo@dominio.com"
                onIonInput={(e) => setEmail(e.detail.value ?? '')}
              />
            </IonItem>
            <IonButton expand="block" className="login-button" onClick={handleLogin}>
              Guardar sesion
            </IonButton>
            {apiError && <IonText color="danger">{apiError}</IonText>}
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Rutas disponibles</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <p>Palenque - Balancan / Balancan - Palenque</p>
            <p>Palenque - Zapata / Zapata - Palenque</p>
            <p>Para comprar, entra a la pestana Reservar.</p>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
