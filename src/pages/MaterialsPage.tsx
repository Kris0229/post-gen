import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MaterialCard from '../components/MaterialCard';
import MaterialDetailModal from '../components/MaterialDetailModal';
import { subscribeToMaterials } from '../services/materials';
import { createSession } from '../services/sessions';
import type { Material } from '../types';

export default function MaterialsPage() {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailMaterial, setDetailMaterial] = useState<Material | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);

  useEffect(() => subscribeToMaterials(setMaterials), []);

  const allTags = useMemo(
    () => Array.from(new Set(materials.flatMap((m) => m.tags))).sort(),
    [materials],
  );

  const filtered = useMemo(() => {
    return materials.filter((m) => {
      if (selectedTags.length > 0 && !selectedTags.some((tag) => m.tags.includes(tag))) return false;
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        if (!m.title.toLowerCase().includes(kw) && !m.note.toLowerCase().includes(kw)) return false;
      }
      return true;
    });
  }, [materials, selectedTags, keyword]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const enterSelection = (id: string) => {
    setSelectionMode(true);
    setSelectedIds([id]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const handleStartWriting = async () => {
    if (selectedIds.length === 0) return;
    setCreatingSession(true);
    try {
      const ordered = materials.filter((m) => selectedIds.includes(m.id));
      const title = ordered[0]?.title ?? '新的寫作';
      const sessionId = await createSession(
        selectedIds,
        title,
      );
      navigate(`/write/${sessionId}`);
    } finally {
      setCreatingSession(false);
    }
  };

  return (
    <div className="pb-24">
      <div className="sticky top-[49px] z-[5] space-y-2 border-b border-giants-black/10 bg-white p-3">
        <input
          type="search"
          placeholder="關鍵字搜尋"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full rounded-md border border-giants-black/20 px-3 py-1.5 text-sm"
        />
        <div className="flex flex-wrap items-center gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                selectedTags.includes(tag)
                  ? 'border-giants-orange bg-giants-orange text-white'
                  : 'border-giants-black/20 text-giants-black/70'
              }`}
            >
              {tag}
            </button>
          ))}
          <button
            type="button"
            onClick={() => (selectionMode ? exitSelection() : setSelectionMode(true))}
            className={`ml-auto rounded-full border px-2.5 py-1 text-xs font-medium ${
              selectionMode
                ? 'border-giants-orange bg-giants-orange text-white'
                : 'border-giants-black/20 text-giants-black/70'
            }`}
          >
            {selectionMode ? '取消多選' : '多選'}
          </button>
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="p-8 text-center text-sm text-giants-black/50">目前沒有符合條件的素材</p>
      )}

      <div>
        {filtered.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            selectionMode={selectionMode}
            selected={selectedIds.includes(material.id)}
            onEnterSelection={enterSelection}
            onToggleSelect={toggleSelect}
            onOpenDetail={setDetailMaterial}
          />
        ))}
      </div>

      {selectionMode && selectedIds.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-giants-black/10 bg-white p-3">
          <button
            type="button"
            onClick={handleStartWriting}
            disabled={creatingSession}
            className="mx-auto block w-full max-w-md rounded-md bg-giants-orange px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {creatingSession ? '建立中…' : `開始寫文章（${selectedIds.length}）`}
          </button>
        </div>
      )}

      {detailMaterial && (
        <MaterialDetailModal
          material={detailMaterial}
          onClose={() => setDetailMaterial(null)}
          onDeleted={() => setDetailMaterial(null)}
        />
      )}
    </div>
  );
}
