import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Article, ArticleState } from '../types';

const articlesCol = collection(db, 'articles');

export function subscribeToArticles(
  showAllStates: boolean,
  onData: (articles: Article[]) => void,
  onError: (error: Error) => void,
) {
  const q = showAllStates
    ? query(articlesCol, orderBy('pubDate', 'desc'))
    : query(articlesCol, where('state', '==', 'new'), orderBy('pubDate', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Article));
    },
    onError,
  );
}

export async function setArticleState(id: string, state: ArticleState) {
  await updateDoc(doc(articlesCol, id), { state });
}

export function subscribeToArticle(id: string, onData: (article: Article | null) => void) {
  return onSnapshot(doc(articlesCol, id), (snap) => {
    onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as Article) : null);
  });
}

export async function updateArticleFullText(id: string, fullText: string) {
  await updateDoc(doc(articlesCol, id), { fullText });
}

export async function updateArticleTranslation(id: string, translation: string) {
  await updateDoc(doc(articlesCol, id), { translation });
}

export async function isLinkDuplicate(link: string): Promise<boolean> {
  const snapshot = await getDocs(query(articlesCol, where('link', '==', link)));
  return !snapshot.empty;
}

export async function addManualArticle(link: string): Promise<void> {
  const article: Omit<Article, 'id'> = {
    title: link,
    link,
    source: '手動',
    aiSummary: '',
    angles: [],
    score: 0,
    pubDate: new Date().toISOString(),
    createdAt: Timestamp.now(),
    state: 'new',
    fullText: '',
    translation: '',
  };
  await addDoc(articlesCol, article);
}
