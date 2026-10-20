// Firebase kurulumu.
// AŞAĞIDAKİ DEĞERLERİ KENDİ FIREBASE PROJENDEN ALIP DOLDURMAN GEREKİYOR.
// Nasıl alınacağı: GOOGLE_LOGIN_KURULUM.md dosyasına bak.
import { initializeApp, getApps, getApp } from 'firebase/app';
// NOT: 'firebase/auth' paketinin RN derlemesi getReactNativePersistence'ı dışa aktarmıyor,
// bu yüzden doğrudan '@firebase/auth' alt paketinden alıyoruz (aynı fonksiyonlar, RN'e özel derleme).
// NOT: '@firebase/auth' paketinin tip tanımları (typings) burada yanlış dosyaya işaret ediyor
// (bilinen bir Firebase SDK / Metro bundler uyumsuzluğu). Çalışma zamanında (runtime) Metro
// doğru React Native derlemesini seçiyor ve fonksiyon gerçekten var oluyor; bu yüzden aşağıdaki
// satırdaki TypeScript uyarısını güvenle bastırıyoruz.
// @ts-ignore
import { initializeAuth, getReactNativePersistence, Auth } from '@firebase/auth';
// @ts-ignore - getReactNativePersistence tip tanımı bazı sürümlerde eksik görünebilir, çalışmasını etkilemez.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, Firestore } from 'firebase/firestore';

// 1) Firebase Console > Project settings > General > Your apps > Web app
//    kısmından kopyalayacağın ayarlar. (Bkz. GOOGLE_LOGIN_KURULUM.md - Adım 2)
const firebaseConfig = {
  apiKey: 'AIzaSyDJASennLWdMHPHBFa8USuoPax5fqB4JM0',
  authDomain: 'adam-viking-english.firebaseapp.com',
  projectId: 'adam-viking-english',
  storageBucket: 'adam-viking-english.firebasestorage.app',
  messagingSenderId: '450993709701',
  appId: '1:450993709701:web:bb33d42450bc037cd6ffec',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let authInstance: Auth;
try {
  authInstance = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Fast refresh sırasında initializeAuth iki kere çağrılırsa hata verir; mevcut instance'ı kullan.
  const { getAuth } = require('@firebase/auth');
  authInstance = getAuth(firebaseApp);
}

export const auth = authInstance;
export const db: Firestore = getFirestore(firebaseApp);
