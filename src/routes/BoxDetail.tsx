import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getBox,
  listItemsInBox,
  createItem,
  updateItem,
  removeItem,
  updateBoxStatus,
  useUI,
} from '@/store';
import type { BoxStatus } from '@/types';

type Item = {
  id: string;
  moveId: string;
  boxId: string;
  name: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

const STATUS: BoxStatus[] = ['open', 'packed', 'sealed', 'unpacked'];

export default function BoxDetail() {
  const { moveId, boxId } = useParams();
  const { setCurrentMove } = useUI();

  const [box, setBox] = useState<any | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [adding, setAdding] = useState(false);
  const itemRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (moveId) setCurrentMove(moveId);
  }, [moveId]);

  async function refresh() {
    if (!boxId) return;
    const [b, it] = await Promise.all([getBox(boxId), listItemsInBox(boxId)]);
    setBox(b || null);
    setItems(it);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxId]);

  const title = useMemo(() => {
    if (!box) return 'Box';
    const num = box.number ? `#${box.number}` : '';
    return [ 'Box', num ].filter(Boolean).join(' ');
  }, [box]);

  async function onAddItem() {
    if (!box || !itemRef.current) return;
    const name = itemRef.current.value.trim();
    if (!name) return;
    setAdding(true);
    await createItem({ boxId: box.id, name });
    itemRef.current.value = '';
    setAdding(false);
    await refresh();
  }

  if (!box) {
    return <div className="text-neutral-500">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">{title}</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600">Status:</label>
          <select
            className="select"
            value={box.status}
            onChange={async (e) => {
              await updateBoxStatus(box.id, e.target.value as BoxStatus);
              await refresh(); // keep detail in sync with Boxes view
            }}
          >
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            ref={itemRef}
            className="input flex-1"
            placeholder="Add item (press Enter)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAddItem();
              }
            }}
          />
          <button className="btn btn-primary" onClick={onAddItem} disabled={adding}>
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>

        <div className="divide-y">
          {items.map((it) => (
            <div key={it.id} className="py-2 flex items-center justify-between">
              <div className="min-w-0 truncate">{it.name}</div>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={async () => {
                    const newName = prompt('Rename item', it.name) ?? '';
                    const trimmed = newName.trim();
                    if (!trimmed) return;
                    await updateItem(it.id, { name: trimmed });
                    await refresh();
                  }}
                >
                  Rename
                </button>
                <button
                  className="btn btn-ghost text-red-600"
                  onClick={async () => {
                    await removeItem(it.id);
                    await refresh();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-neutral-500">No items yet. Add your first item above.</div>
          )}
        </div>
      </div>

      <div>
        <Link className="btn btn-ghost" to={`/moves/${box.moveId}/boxes?roomId=${box.roomId}`}>
          Back to Boxes
        </Link>
      </div>
    </div>
  );
}
