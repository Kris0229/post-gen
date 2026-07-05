import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Article } from '../types';
import { formatRelativeTime, sourceColor } from '../lib/format';

const SWIPE_THRESHOLD = 72;
const LONG_PRESS_MS = 550;

interface ArticleRowProps {
  article: Article;
  onSkip: (id: string) => void;
}

export default function ArticleRow({ article, onSkip }: ArticleRowProps) {
  const navigate = useNavigate();
  const [dragX, setDragX] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const clearLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    longPressFired.current = false;
    startX.current = e.clientX;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      onSkip(article.id);
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) > 8) clearLongPress();
    setDragX(Math.min(0, delta));
  };

  const endDrag = () => {
    dragging.current = false;
    clearLongPress();
    if (!longPressFired.current && dragX <= -SWIPE_THRESHOLD) {
      onSkip(article.id);
    }
    setDragX(0);
  };

  const handleClick = () => {
    if (longPressFired.current || Math.abs(dragX) > 4) return;
    navigate(`/article/${article.id}`);
  };

  return (
    <div className="relative overflow-hidden border-b border-giants-black/10">
      <div className="absolute inset-0 flex items-center justify-end bg-giants-orange px-4 text-sm font-medium text-white">
        略過
      </div>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClick={handleClick}
        style={{ transform: `translateX(${dragX}px)` }}
        className="relative bg-white px-4 py-3 transition-transform duration-150 ease-out cursor-pointer select-none"
      >
        <div className="mb-1 flex items-center gap-2">
          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${sourceColor(article.source)}`}>
            {article.source}
          </span>
          {article.score >= 4 && (
            <span className="rounded bg-giants-orange px-1.5 py-0.5 text-xs font-bold text-white">
              {article.score}
            </span>
          )}
          <span className="ml-auto text-xs text-giants-black/50">
            {formatRelativeTime(article.pubDate)}
          </span>
        </div>
        <h3 className="font-medium text-giants-black">{article.title}</h3>
        {article.aiSummary && (
          <p className="mt-1 line-clamp-2 text-sm text-giants-black/60">{article.aiSummary}</p>
        )}
      </div>
    </div>
  );
}
