import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getBox,
  listItemsInBox,
  createItem,
  updateItem,
  removeItem,
  updateBox,
  updateBoxStatus,
  addImagesToBox,
  addImagesToItem,
  listRooms,
  useUI,
} from '@/store';
import type { BoxStatus } from '@/types';
import ImageGrid from '@/components/ImageGrid';
import ImageUploader from '@/components/ImageUploader';

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
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const itemRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (moveId) setCurrentMove(moveId); }, [moveId]);

  async function refresh() {
    if (!boxId || !moveId) return;
    const [b, it, rms] = await Promise.all([getBox(boxId), listItemsInBox(boxId), listRooms(moveId)]);
    setBox(b || null);
    setItems(it);
    setRooms(rms as any);
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [boxId]);

  const title = useMemo(() => (box?.number ? `Box: #${box.number}` : 'Box'), [box]);

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

  async function saveAndBack() {
    if (!box) return;
    setSaving(true);
    // no box-level notes in Phase 3B
    setSaving(false);
    history.back();
  }

  if (!box) return <div className="text-neutral-500">Loading…</div>;

  return (
    <div className="space-y-6">
      {/* Header: title + room selector + status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="h1">{title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-600">Room:</label>
            <select
              className="select"
              value={box.roomId}
              onChange={async (e) => {
                await updateBox(box.id, { roomId: e.target.value });
                await refresh();
              }}
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-600">Status:</label>
            <select
              className="select"
              value={box.status}
              onChange={async (e) => {
                await updateBoxStatus(box.id, e.target.value as BoxStatus);
                await refresh();
              }}
            >
              {STATUS.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
        </div>
      </div>

      {/* Images */}
      <section className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Images</h2>
          <ImageUploader label="Add Image(s)" multiple preferCamera onFiles={async (files) => { await addImagesToBox(box.id, files); await refresh(); }} />
        </div>
        <ImageGrid parentType="box" parentId={box.id} />
      </section>

      {/* Items */}
      <section className="card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <input
            ref={itemRef}
            className="input flex-1"
            placeholder="Add item (press Enter)"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddItem(); } }}
          />
          <button className="btn btn-primary" onClick={onAddItem} disabled={adding}>
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>

        <div className="divide-y">
          {items.map((it) => (
            <EditableItem
              key={it.id}
              item={it}
              onChange={async (patch) => { await updateItem(it.id, patch); await refresh(); }}
              onDelete={async () => { await removeItem(it.id); await refresh(); }}
              onAddImages={async (files) => { await addImagesToItem(it.id, files); await refresh(); }}
            />
          ))}
          {items.length === 0 && <div className="text-neutral-500">No items yet. Add your first item above.</div>}
        </div>
      </section>

      <div>
        <button className="btn btn-ghost" onClick={saveAndBack} disabled={saving}>
          {saving ? 'Saving…' : 'Save and back'}
        </button>
        <Link className="btn btn-ghost ml-2" to={`/moves/${box.moveId}/boxes?roomId=${box.roomId}`}>Cancel</Link>
      </div>
    </div>
  );
}

/* ---------- inline item edit ---------- */
function EditableItem({
  item, onChange, onDelete, onAddImages,
}: {
  item: Item;
  onChange: (patch: Partial<Item>) => Promise<void>;
  onDelete: () => Promise<void>;
  onAddImages: (files: File[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [notes, setNotes] = useState(item.notes ?? '');

  useEffect(() => { setName(item.name); setNotes(item.notes ?? ''); }, [item.id]);

  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 truncate">{item.name}</div>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => setOpen(v => !v)}>{open ? 'Close' : 'Edit'}</button>
          <button className="btn btn-ghost text-red-600" onClick={onDelete}>Delete</button>
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-neutral-600 mb-1">Rename</div>
              <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <div className="text-sm text-neutral-600 mb-1">Notes</div>
              <textarea className="input w-full h-24" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">Images</div>
              <ImageUploader label="Add Image(s)" multiple preferCamera onFiles={onAddImages} />
            </div>
            <ImageGrid parentType="item" parentId={item.id} />
          </div>

          <div className="pt-1">
            <button
              className="btn btn-primary"
              onClick={async () => { await onChange({ name: name.trim() || item.name, notes }); setOpen(false); }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
