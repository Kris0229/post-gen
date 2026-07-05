import { Timestamp, addDoc, arrayUnion, collection, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Session } from '../types';

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
