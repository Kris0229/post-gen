import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';

export function listenAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function signInWithGoogle() {
  return signInWithPopup(auth, new GoogleAuthProvider());
}

export function signOutUser() {
  return signOut(auth);
}
