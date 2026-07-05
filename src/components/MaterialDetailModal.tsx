import { useState } from 'react';
import { deleteMaterial, updateMaterial } from '../services/materials';
import type { Material } from '../types';

interface MaterialDetailModalProps {
  material: Material;
  onClose: () => void;
  onDeleted: () => void;
}

export default function MaterialDetailModal({ material, onClose, onDeleted }: MaterialDetailModalProps) {
  const [title, setTitle] = useState(material.title);
  const [tags, setTags] = useState<string[]>(material.tags);
  const [newTag, setNewTag] = useState('');
  const [note, setNote] = useState(material.note);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  const addNewTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setNewTag('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMaterial(material.id, { title: title.trim(), tags, note: note.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await deleteMaterial(material.id);
    onDeleted();
  };

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-xl bg-white sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto p-4">
          <label className="mb-1 block text-sm font-medium text-giants-black">標題</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mb-1 w-full rounded-md border border-giants-black/20 px-3 py-1.5 text-sm font-bold text-giants-black"
          />
          <a
            href={material.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-block text-xs text-giants-orange underline"
          >
            開啟原文
          </a>

          <label className="mb-1 block text-sm font-medium text-giants-black">標籤</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-giants-orange px-2.5 py-1 text-xs font-medium text-white"
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)} aria-label={`移除標籤 ${tag}`}>
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addNewTag();
                }
              }}
              placeholder="新增標籤"
              className="flex-1 rounded-md border border-giants-black/20 px-3 py-1.5 text-sm"
            />
            <button
              type="button"
              onClick={addNewTag}
              className="rounded-md border border-giants-black/20 px-3 py-1.5 text-sm font-medium text-giants-black"
            >
              新增
            </button>
          </div>

          <label className="mb-1 block text-sm font-medium text-giants-black">備註</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mb-4 w-full rounded-md border border-giants-black/20 px-3 py-2 text-sm"
          />

          <label className="mb-1 block text-sm font-medium text-giants-black">譯文全文</label>
          <p className="whitespace-pre-wrap rounded-md bg-giants-black/5 p-3 text-sm leading-relaxed text-giants-black">
            {material.translation || '（無譯文）'}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-giants-black/10 p-3">
          {confirmingDelete ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-giants-black/70">確定刪除？</span>
              <button type="button" onClick={handleDelete} className="font-medium text-red-600">
                確定
              </button>
              <button type="button" onClick={() => setConfirmingDelete(false)} className="text-giants-black/60">
                取消
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmingDelete(true)} className="text-sm font-medium text-red-600">
              刪除
            </button>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-md px-3 py-2 text-sm font-medium text-giants-black/70">
              關閉
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-md bg-giants-orange px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? '儲存中…' : '儲存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
