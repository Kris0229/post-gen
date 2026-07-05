import { useEffect, useState, type ReactNode } from 'react';
import { listenAuthState, signInWithGoogle, signOutUser } from '../services/auth';
import { useAuthStore } from '../store/authStore';

const OWNER_UID = import.meta.env.VITE_OWNER_UID;

function CenterScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      {children}
    </div>
  );
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, setUser } = useAuthStore();
  const [signInError, setSignInError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = listenAuthState(setUser);
    return unsubscribe;
  }, [setUser]);

  if (loading) {
    return (
      <CenterScreen>
        <p className="text-giants-black/60">載入中…</p>
      </CenterScreen>
    );
  }

  if (!user) {
    return (
      <CenterScreen>
        <h1 className="text-xl font-bold text-giants-black">巨人情報站 內容工作台</h1>
        <button
          type="button"
          onClick={() => signInWithGoogle().catch((e) => setSignInError(String(e)))}
          className="rounded-md bg-giants-orange px-4 py-2 font-medium text-white"
        >
          使用 Google 登入
        </button>
        {signInError && <p className="text-sm text-red-600">登入失敗：{signInError}</p>}
      </CenterScreen>
    );
  }

  if (OWNER_UID && user.uid !== OWNER_UID) {
    return (
      <CenterScreen>
        <h1 className="text-xl font-bold text-giants-black">此帳號未授權</h1>
        <p className="text-sm text-giants-black/60">
          目前登入帳號：{user.email}
          <br />
          UID：{user.uid}
        </p>
        <button
          type="button"
          onClick={() => signOutUser()}
          className="rounded-md border border-giants-black/20 px-4 py-2 font-medium text-giants-black"
        >
          登出
        </button>
      </CenterScreen>
    );
  }

  if (!OWNER_UID) {
    return (
      <div>
        <div className="bg-giants-orange/10 px-4 py-2 text-sm text-giants-black">
          尚未設定白名單（VITE_OWNER_UID）。你的 UID：
          <code className="mx-1 rounded bg-white px-1">{user.uid}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(user.uid);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="underline"
          >
            {copied ? '已複製' : '複製'}
          </button>
          ，請加入 .env 的 VITE_OWNER_UID 並重啟 dev server 以鎖定存取。
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
