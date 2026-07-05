import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Material } from '../types';

const materialsCol = collection(db, 'materials');

export async function getAllTags(): Promise<string[]> {
  const snapshot = await getDocs(materialsCol);
  const tagSet = new Set<string>();
  snapshot.forEach((d) => {
    const data = d.data() as Material;
    for (const tag of data.tags ?? []) tagSet.add(tag);
  });
  return Array.from(tagSet).sort();
}

export async function addMaterial(
  data: Omit<Material, 'id' | 'createdAt' | 'usedInSessions'>,
): Promise<void> {
  const material: Omit<Material, 'id'> = {
    ...data,
    createdAt: Timestamp.now(),
    usedInSessions: [],
  };
  await addDoc(materialsCol, material);
}

export function subscribeToMaterials(onData: (materials: Material[]) => void) {
  const q = query(materialsCol, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    onData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Material));
  });
}

export async function updateMaterial(
  id: string,
  patch: Partial<Pick<Material, 'title' | 'tags' | 'note'>>,
) {
  await updateDoc(doc(materialsCol, id), patch);
}

export async function deleteMaterial(id: string) {
  await deleteDoc(doc(materialsCol, id));
}
