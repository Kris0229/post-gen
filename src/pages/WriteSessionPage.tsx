import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getMaterialsByIds } from '../services/materials';
import { saveFinalDraft, subscribeToSession, updateSessionMessages } from '../services/sessions';
import { getConfig } from '../services/settings';
import { OpenAIError, streamChatCompletion } from '../lib/openai';
import SessionMaterialsPanel from '../components/SessionMaterialsPanel';
import type { ChatMessage, Material, Session } from '../types';

const MAX_SESSION_CHARS = 50000;

function buildKickoffMessage(materials: Material[]): string {
  const parts = materials.map(
    (m, i) => `【素材${i + 1}：${m.title}】\n${m.translation || m.originalText}`,
  );
  return `以下是本次寫作素材：\n\n${parts.join('\n\n')}\n\n請先根據素材提出 2–3 個主題與大綱建議，與我討論後再動筆。`;
}

export default function WriteSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [streamingReply, setStreamingReply] = useState('');
  const [showMaterialsDrawer, setShowMaterialsDrawer] = useState(false);
  const initialized = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) return;
    initialized.current = false;
    setSession(undefined);
    setMaterials([]);
    const unsubscribe = subscribeToSession(sessionId, setSession);
    return unsubscribe;
  }, [sessionId]);

  useEffect(() => {
    if (!session) return;
    getMaterialsByIds(session.materialIds).then(setMaterials);
    // materialIds never change after session creation; keying on session.id avoids
    // refetching on every message update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  useEffect(() => {
    if (!session || materials.length === 0 || initialized.current) return;
    if (session.messages.length > 0) {
      initialized.current = true;
      return;
    }
    initialized.current = true;
    const kickoff: ChatMessage = { role: 'user', content: buildKickoffMessage(materials) };
    void (async () => {
      await updateSessionMessages(session.id, [kickoff]);
      await sendTurn([kickoff]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, materials]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, streamingReply]);

  async function sendTurn(baseMessages: ChatMessage[]) {
    if (!sessionId) return;
    const config = await getConfig();
    if (!config.apiKey) {
      navigate('/settings');
      return;
    }
    setSending(true);
    setSendError('');
    setStreamingReply('');
    let acc = '';
    try {
      for await (const chunk of streamChatCompletion({
        apiKey: config.apiKey,
        model: 'gpt-5.2',
        reasoningEffort: 'high',
        messages: [
          { role: 'system', content: config.blogInstructions },
          ...baseMessages.map((m) => ({ role: m.role, content: m.content })),
        ],
      })) {
        acc += chunk;
        setStreamingReply(acc);
      }
      await updateSessionMessages(sessionId, [...baseMessages, { role: 'assistant', content: acc }]);
    } catch (e) {
      if (acc) {
        await updateSessionMessages(sessionId, [...baseMessages, { role: 'assistant', content: acc }]).catch(
          () => {},
        );
      }
      if (e instanceof OpenAIError && e.status === 401) {
        navigate('/settings');
        return;
      }
      setSendError(e instanceof Error ? e.message : '回覆失敗');
    } finally {
      setSending(false);
    }
  }

  async function handleSend() {
    if (!session || !input.trim() || sending) return;
    const newMessages: ChatMessage[] = [...session.messages, { role: 'user', content: input.trim() }];
    setInput('');
    await updateSessionMessages(session.id, newMessages);
    await sendTurn(newMessages);
  }

  function handleRetry() {
    if (!session) return;
    void sendTurn(session.messages);
  }

  async function handleSaveFinalDraft(content: string) {
    if (!session) return;
    await saveFinalDraft(session.id, content);
  }

  async function handleCopy(content: string) {
    await navigator.clipboard.writeText(content);
  }

  if (session === undefined) {
    return <div className="p-4 text-sm text-giants-black/50">載入中…</div>;
  }
  if (session === null) {
    return <div className="p-4 text-sm text-giants-black/50">找不到這個寫作 session</div>;
  }

  const totalChars = session.messages.reduce((sum, m) => sum + m.content.length, 0);

  return (
    <div className="flex">
      <aside className="fixed bottom-0 left-0 top-[49px] hidden w-64 shrink-0 overflow-y-auto border-r border-giants-black/10 p-3 sm:block">
        <h2 className="mb-2 text-xs font-bold text-giants-black/50">本次素材</h2>
        <SessionMaterialsPanel materials={materials} />
      </aside>

      <div className="flex-1 pb-32 sm:ml-64">
        <div className="flex items-center justify-between border-b border-giants-black/10 p-3 sm:hidden">
          <h1 className="truncate text-sm font-bold text-giants-black">{session.title}</h1>
          <button
            type="button"
            onClick={() => setShowMaterialsDrawer(true)}
            className="shrink-0 rounded-full border border-giants-black/20 px-2.5 py-1 text-xs font-medium text-giants-black"
          >
            素材（{materials.length}）
          </button>
        </div>

        {session.status === 'done' && (
          <div className="bg-emerald-50 px-3 py-2 text-xs text-emerald-800">此 session 已定稿</div>
        )}
        {totalChars > MAX_SESSION_CHARS && (
          <div className="bg-amber-50 px-3 py-2 text-xs text-amber-800">
            此對話已超過 5 萬字，建議另開新 session 以維持品質
          </div>
        )}

        <div className="space-y-4 p-4">
          {session.messages.map((message, i) => (
            <div key={i} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-giants-orange text-white'
                    : 'bg-giants-black/5 text-giants-black'
                }`}
              >
                {message.content}
                {message.role === 'assistant' && (
                  <div className="mt-2 flex gap-3 border-t border-giants-black/10 pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSaveFinalDraft(message.content)}
                      className="font-medium text-giants-orange"
                    >
                      {session.finalDraft === message.content ? '目前定稿' : '存為定稿'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(message.content)}
                      className="font-medium text-giants-black/60"
                    >
                      複製全文
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-lg bg-giants-black/5 px-3 py-2 text-sm leading-relaxed text-giants-black">
                {streamingReply || '思考中…'}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-giants-black/10 bg-white p-3 sm:left-64">
          {sendError && (
            <div className="mb-2 flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              <span>{sendError}</span>
              <button type="button" onClick={handleRetry} className="font-medium underline">
                重試
              </button>
            </div>
          )}
          <div className="mx-auto flex max-w-2xl gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="輸入訊息，⌘/Ctrl+Enter 送出"
              rows={2}
              className="flex-1 resize-none rounded-md border border-giants-black/20 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="rounded-md bg-giants-orange px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              送出
            </button>
          </div>
        </div>
      </div>

      {showMaterialsDrawer && (
        <div
          className="fixed inset-0 z-20 bg-black/40 sm:hidden"
          onClick={() => setShowMaterialsDrawer(false)}
        >
          <div
            className="max-h-[70vh] overflow-y-auto rounded-b-xl bg-white p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-xs font-bold text-giants-black/50">本次素材</h2>
            <SessionMaterialsPanel materials={materials} />
          </div>
        </div>
      )}
    </div>
  );
}
