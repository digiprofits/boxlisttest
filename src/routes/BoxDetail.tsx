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
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const itemRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => { if (moveId) setCurrentMove(moveId); }, [moveId]);

  async function refresh() {
    if (!boxId) return;
    const [b, it] = await Promise.all([getBox(boxId), listItemsInBox(boxId)]);
    setBox(b || null);
    setItems(it);
    setNotes(b?.notes ?? '');
  }

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [boxId]);

  const title = useMemo(() => (box?.number ? `#${box.number}` : 'Box'), [box]);

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
    await updateBox(box.id, { notes });
    setSaving(false);
    history.back();
  }

  if (!box) return <div className="text-neutral-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">{title}</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-neutral-600">Status:</label>
          <select
            className="select"
            value={box.status}
            onChange={async (e) => { await updateBoxStatus(box.id, e.target.value as BoxStatus); await refresh(); }}
          >
            {STATUS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </div>
      </div>

      {/* Notes */}
      <section className="card p-4 space-y-2">
        <h2 className="font-semibold">Notes</h2>
        <textarea
          className="input w-full h-28"
          placeholder="Add box notes…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </section>

      {/* Images */}
      <section className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Images</h2>
          <ImageUploader label="Add Image(s)" multiple onFiles={async (files) => { await addImagesToBox(box.id, files); }} />
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
          {saving ? 'Saving…' : 'Save and back to Boxes'}
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
              <ImageUploader label="Add Image(s)" multiple onFiles={onAddImages} />
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
