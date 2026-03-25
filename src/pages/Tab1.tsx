import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
  useIonToast
} from '@ionic/react';
import { getRedirectResult, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import { auth, googleProvider } from '../firebase';
import type { Passenger } from '../types';
import './Tab1.css';

interface Tab1Props {
  activePassenger: Passenger;
  onLogin: (passenger: Passenger) => Promise<Passenger>;
  onLogout: () => void;
  apiError: string;
}

const Tab1: React.FC<Tab1Props> = ({ activePassenger, onLogin, onLogout, apiError }) => {
  const [loading, setLoading] = useState(false);
  const [present] = useIonToast();

  const finalizeLogin = useCallback(async (name: string | null, email: string | null) => {
    if (!email) {
      present({ message: 'No se pudo obtener el correo de Google.', duration: 1800, color: 'danger' });
      return;
    }

    try {
      await onLogin({ name: name ?? 'Pasajero', email: email.toLowerCase() });
      present({ message: 'Sesion iniciada con Google.', duration: 1600, color: 'success' });
    } catch (error) {
      present({ message: error instanceof Error ? error.message : 'Error de autenticacion.', duration: 1800, color: 'danger' });
    }
  }, [onLogin, present]);

  useEffect(() => {
    let mounted = true;
    getRedirectResult(auth)
      .then((result) => {
        if (!mounted || !result?.user) return;
        void finalizeLogin(result.user.displayName, result.user.email);
      })
      .catch(() => {
        // Ignore redirect failures; user can try again with popup.
      });
    return () => {
      mounted = false;
    };
  }, [finalizeLogin]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await finalizeLogin(result.user.displayName, result.user.email);
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, googleProvider);
      } else {
        present({ message: 'No se pudo iniciar con Google.', duration: 1800, color: 'danger' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    onLogout();
    present({ message: 'Sesion cerrada.', duration: 1400, color: 'medium' });
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
            <IonCardSubtitle>Ingreso con Google</IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            {activePassenger.email ? (
              <>
                <IonItem>
                  <IonLabel>
                    <strong>Sesión activa</strong>
                    <p>{activePassenger.name}</p>
                    <p>{activePassenger.email}</p>
                  </IonLabel>
                </IonItem>
                <IonButton expand="block" color="medium" onClick={handleLogout}>
                  Cerrar sesión
                </IonButton>
              </>
            ) : (
              <IonButton expand="block" className="login-button" disabled={loading} onClick={handleGoogleLogin}>
                {loading ? 'Conectando…' : 'Iniciar con Google'}
              </IonButton>
            )}
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
