import {
  Timestamp,
  addDoc,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ChatMessage, Session } from '../types';

const sessionsCol = collection(db, 'sessions');
const materialsCol = collection(db, 'materials');

export async function createSession(materialIds: string[], title: string): Promise<string> {
  const session: Omit<Session, 'id'> = {
    title,
    materialIds,
    messages: [],
    finalDraft: '',
    fbPost: '',
    status: 'writing',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const ref = await addDoc(sessionsCol, session);
  await Promise.all(
    materialIds.map((id) => updateDoc(doc(materialsCol, id), { usedInSessions: arrayUnion(ref.id) })),
  );
  return ref.id;
}

export function subscribeToSession(id: string, onData: (session: Session | null) => void) {
  return onSnapshot(doc(sessionsCol, id), (snap) => {
    onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as Session) : null);
  });
}

export function subscribeToSessions(onData: (sessions: Session[]) => void) {
  const q = query(sessionsCol, orderBy('updatedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    onData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Session));
  });
}

export async function updateSessionMessages(id: string, messages: ChatMessage[]) {
  await updateDoc(doc(sessionsCol, id), { messages, updatedAt: Timestamp.now() });
}

export async function saveFinalDraft(id: string, content: string) {
  await updateDoc(doc(sessionsCol, id), {
    finalDraft: content,
    status: 'done',
    updatedAt: Timestamp.now(),
  });
}
