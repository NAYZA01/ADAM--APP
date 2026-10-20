// Google ile giriş akışı.
import { useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential, signOut as firebaseSignOut, onAuthStateChanged, User } from '@firebase/auth';
import { auth } from './firebase';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_IDS = {
  webClientId: '450993709701-plerd8a736k0cb8ri38dgf8m4hpf268g.apps.googleusercontent.com',
  androidClientId: '450993709701-aiqer222vuakkto6g8tigsel65k75p7a.apps.googleusercontent.com',
  iosClientId: '',
};

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_CLIENT_IDS.webClientId,
    androidClientId: GOOGLE_CLIENT_IDS.androidClientId,
    iosClientId: GOOGLE_CLIENT_IDS.iosClientId,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).catch((err) => {
        console.warn('Firebase Google giriş hatası:', err);
      });
    }
  }, [response]);

  return { request, response, promptAsync };
}

export function watchAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function signOutGoogle() {
  return firebaseSignOut(auth);
}