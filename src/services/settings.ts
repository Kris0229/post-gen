import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { AppConfig } from '../types';

const configDocRef = doc(db, 'settings', 'config');

const DEFAULT_CONFIG: AppConfig = {
  translatorInstructions: '',
  blogInstructions: '',
  fetchWebhookUrl: '',
};

export async function getConfig(): Promise<AppConfig> {
  const snap = await getDoc(configDocRef);
  return snap.exists() ? { ...DEFAULT_CONFIG, ...(snap.data() as Partial<AppConfig>) } : DEFAULT_CONFIG;
}

export function subscribeConfig(onData: (config: AppConfig) => void) {
  return onSnapshot(configDocRef, (snap) => {
    onData(snap.exists() ? { ...DEFAULT_CONFIG, ...(snap.data() as Partial<AppConfig>) } : DEFAULT_CONFIG);
  });
}

export async function updateConfig(patch: Partial<AppConfig>) {
  await setDoc(configDocRef, patch, { merge: true });
}
