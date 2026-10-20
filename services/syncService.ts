// Kullanıcının ilerleme verisini Firestore'da "users/{uid}" dokümanında saklar.
// Böylece her kullanıcı kendi Google hesabına bağlı, kendi bulut kaydına sahip olur.
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type CloudProgress = {
  onboarded?: boolean;
  level?: string;
  goal?: number;
  notebook?: string[];
  progress?: Record<string, number>;
  review?: Record<string, { next: number; interval: number; box: number }>;
  streak?: { count: number; lastDate: string };
  coins?: number;
};

export async function pullCloudData(uid: string): Promise<CloudProgress | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data() as CloudProgress) : null;
  } catch (e) {
    console.warn('Bulut verisi okunamadı:', e);
    return null;
  }
}

export async function pushCloudData(uid: string, data: CloudProgress): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.warn('Bulut verisi yazılamadı:', e);
  }
}

export async function pushField(uid: string, field: string, value: any): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid), { [field]: value, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.warn('Bulut alanı yazılamadı:', e);
  }
}
