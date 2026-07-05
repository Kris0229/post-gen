import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeToSessions } from '../services/sessions';
import { formatRelativeTime } from '../lib/format';
import type { Session } from '../types';

export default function WriteListPage() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => subscribeToSessions(setSessions), []);

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-bold text-giants-black">寫作</h1>

      {sessions.length === 0 && (
        <p className="text-sm text-giants-black/50">還沒有寫作 session，到素材庫勾選幾筆素材開始吧</p>
      )}

      <div className="space-y-2">
        {sessions.map((session) => (
          <Link
            key={session.id}
            to={`/write/${session.id}`}
            className="block rounded-md border border-giants-black/10 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="truncate font-medium text-giants-black">{session.title}</h2>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  session.status === 'done'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {session.status === 'done' ? '已完成' : '進行中'}
              </span>
            </div>
            <p className="mt-1 text-xs text-giants-black/50">
              {formatRelativeTime(session.updatedAt.toDate().toISOString())}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
