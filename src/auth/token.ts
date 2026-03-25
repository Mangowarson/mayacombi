import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth } from '../firebase';

export const getAuthToken = async (): Promise<string | null> => {
  try {
    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseAuthentication.getIdToken();
      return result.token ?? null;
    }

    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
};
