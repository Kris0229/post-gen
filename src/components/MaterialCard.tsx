import { useRef } from 'react';
import type { Material } from '../types';
import { sourceColor } from '../lib/format';

const LONG_PRESS_MS = 550;

interface MaterialCardProps {
  material: Material;
  selectionMode: boolean;
  selected: boolean;
  onEnterSelection: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (material: Material) => void;
}

export default function MaterialCard({
  material,
  selectionMode,
  selected,
  onEnterSelection,
  onToggleSelect,
  onOpenDetail,
}: MaterialCardProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const handlePointerDown = () => {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      onEnterSelection(material.id);
    }, LONG_PRESS_MS);
  };

  const clearLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const handleClick = () => {
    if (longPressFired.current) return;
    if (selectionMode) {
      onToggleSelect(material.id);
    } else {
      onOpenDetail(material);
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={clearLongPress}
      onPointerLeave={clearLongPress}
      onClick={handleClick}
      className={`flex cursor-pointer select-none gap-3 border-b border-giants-black/10 p-4 ${
        selected ? 'bg-giants-orange/10' : 'bg-white'
      }`}
    >
      {selectionMode && (
        <input
          type="checkbox"
          checked={selected}
          readOnly
          className="mt-1 h-4 w-4 shrink-0 accent-giants-orange"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${sourceColor(material.source)}`}>
            {material.source}
          </span>
          {material.usedInSessions.length > 0 && (
            <span className="rounded bg-giants-black/10 px-1.5 py-0.5 text-xs text-giants-black/60">已使用</span>
          )}
          <span className="ml-auto text-xs text-giants-black/50">
            {material.createdAt.toDate().toLocaleDateString('zh-TW')}
          </span>
        </div>
        <h3 className="font-medium text-giants-black">{material.title}</h3>
        {material.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {material.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-giants-black/5 px-2 py-0.5 text-xs text-giants-black/70">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
