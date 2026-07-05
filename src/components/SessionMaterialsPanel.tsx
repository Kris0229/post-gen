import { useState } from 'react';
import type { Material } from '../types';

export default function SessionMaterialsPanel({ materials }: { materials: Material[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      {materials.map((material) => (
        <div key={material.id} className="rounded-md border border-giants-black/10">
          <button
            type="button"
            onClick={() => setExpandedId((prev) => (prev === material.id ? null : material.id))}
            className="w-full px-2 py-1.5 text-left text-sm font-medium text-giants-black"
          >
            {material.title}
          </button>
          {expandedId === material.id && (
            <p className="whitespace-pre-wrap border-t border-giants-black/10 p-2 text-xs leading-relaxed text-giants-black/70">
              {material.translation || material.originalText}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
