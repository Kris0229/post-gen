import { Timestamp, addDoc, collection, getDocs } from 'firebase/firestore';
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
