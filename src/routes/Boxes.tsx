import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as Store from '@/store';

type Box = {
  id: string;
  name: string;
  moveId: string;
  status?: string;
  images?: string[]; // data URLs or blob URLs
};

type Item = {
  id: string;
  name: string;
  notes?: string;
  boxId: string;
  updatedAt?: number;
};

const STATUS_OPTIONS = ['Open', 'Packed', 'Sealed', 'Unpacked'] as const;

export default function BoxView() {
  const nav = useNavigate();
  const { moveId, boxId } = useParams();

  const [box, setBox] = useState<Box | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Add-item form
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  // Inline edit for existing item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // ---- helpers to call store functions safely regardless of exact export names ----
  async function call(fn: string, ...args: any[]) {
    const f = (Store as any)[fn];
    if (typeof f === 'function') return await f(...args);
    return undefined;
  }

  // ---- load box + items ----
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!moveId || !boxId) return;
      setLoading(true);

      // Load boxes for this move and find the one we want (robust to store API variants)
      let found: Box | undefined;
      const list = (await call('listBoxes', moveId)) as Box[] | undefined;
      if (list) found = list.find((b) => b.id === boxId);

      // Fallback: try a direct getter if available
      if (!found) {
        const direct = (await call('getBox', boxId)) as Box | undefined;
        if (direct) found = direct;
      }
      if (!found) {
        const byId = (await call('getBoxById', boxId)) as Box | undefined;
        if (byId) found = byId;
      }

      const boxData = found ?? null;
      if (!alive) return;
      setBox(boxData);

      // Load items
      let loaded: Item[] = (await call('listItemsInBox', boxId)) || [];
      // newest first
      loaded = loaded.sort((a: Item, b: Item) => (b.updatedAt || 0) - (a.updatedAt || 0));
      if (!alive) return;
      setItems(loaded);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [moveId, boxId]);

  // ---- status change ----
  async function onStatusChange(next: string) {
    if (!box) return;
    setBox({ ...box, status: next }); // optimistic
    // Try common store APIs
    await call('updateBoxStatus', box.id, next) ??
      call('updateBox', box.id, { status: next }) ??
      call('saveBox', { ...box, status: next });
  }

  // ---- images ----
  function openImageFull(url: string) {
    // open the image in a new tab (mobile will preview)
    window.open(url, '_blank');
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !box) return;
    // Convert to DataURL for portability
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      // Persist using whichever API exists
      await call('addBoxImage', box.id, dataUrl) ?? call('appendBoxImage', box.id, dataUrl);
      // refresh local
      setBox((prev) =>
        prev ? { ...prev, images: [...(prev.images || []), dataUrl] } : prev,
      );
    };
    reader.readAsDataURL(file);
    // reset input so the same image can be chosen again if needed
    e.currentTarget.value = '';
  }

  async function removeImage(img: string) {
    if (!box) return;
    await call('removeBoxImage', box.id, img) ?? call('deleteBoxImage', box.id, img);
    setBox((prev) =>
      prev ? { ...prev, images: (prev.images || []).filter((u) => u !== img) } : prev,
    );
  }

  // ---- add item ----
  async function addItem() {
    if (!box) return;
    const name = newName.trim();
    if (!name) {
      nameRef.current?.focus();
      return;
    }
    const notes = newNotes.trim();
    const payload = { name, notes, boxId: box.id, updatedAt: Date.now() };

    // Persist (try common APIs)
    let created: Item | undefined =
      (await call('createItem', payload)) ||
      (await call('addItemToBox', box.id, { name, notes })) ||
      (await call('addItem', box.id, { name, notes }));

    // fallback: construct a lightweight client-side object if store returns nothing
    if (!created) {
      created = { id: crypto.randomUUID(), ...payload };
    }

    // Update UI
    setItems((prev) => [{ ...created! }, ...prev]);
    setNewName('');
    setNewNotes('');
    // focus back to name for quick entry
    nameRef.current?.focus();
  }

  // Enter key on name should add immediately (save and close)
  function onNameKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  }

  // ---- edit / delete existing item ----
  function startEdit(it: Item) {
    setEditingId(it.id);
    setEditName(it.name);
    setEditNotes(it.notes || '');
  }

  async function saveEdit(id: string) {
    const patch = {
      name: editName.trim() || 'Untitled',
      notes: editNotes.trim(),
      updatedAt: Date.now(),
    };
    await call('updateItem', id, patch) ?? call('saveItem', id, patch);
    setItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, ...patch } : it))
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    );
    setEditingId(null);
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item?')) return;
    await call('removeItem', id) ?? call('deleteItem', id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  // ---- Save button handler (top-right) ----
  function saveAndExit() {
    // data is already auto-saved; navigate back to boxes list
    nav(`/moves/${moveId}/boxes`);
  }

  if (loading || !box) {
    return <div className="text-neutral-600">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Back + Title Row with Save on the right */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost" onClick={() => nav(-1)} aria-label="Back">
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Box</h1>
        </div>
        <button className="btn btn-primary" onClick={saveAndExit}>
          Save
        </button>
      </div>

      {/* Box card */}
      <div className="card p-4 space-y-4">
        {/* Box name + (Save already above) */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold">{box.name}</h2>
        </div>

        {/* Status */}
        <div>
          <div className="text-neutral-600 mb-1">Status</div>
          <select
            className="input"
            value={box.status || 'Open'}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Images */}
        <div>
          <div className="text-neutral-600 mb-2">Box Images</div>
          {box.images && box.images.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {box.images.map((src) => (
                <div key={src} className="relative">
                  <img
                    src={src}
                    alt=""
                    className="h-28 w-28 rounded-xl object-cover border border-neutral-200"
                    onClick={() => openImageFull(src)}
                  />
                  <button
                    className="btn btn-ghost btn-icon absolute -top-2 -right-2 bg-white/90"
                    onClick={() => removeImage(src)}
                    aria-label="Remove image"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-neutral-500">No images yet.</div>
          )}

          <div className="mt-2">
            <label className="btn btn-ghost cursor-pointer">
              Add Images
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onPickImage}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Add item */}
      <div className="card p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Item name</label>
          <input
            ref={nameRef}
            className="input"
            placeholder="e.g., Plates"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={onNameKey}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <input
            className="input"
            placeholder="Glass / fragile"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addItem();
              }
            }}
          />
        </div>

        <div>
          <button className="btn btn-primary" onClick={addItem}>
            Add Item (Enter)
          </button>
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="card p-4 text-neutral-600">
            No items yet. Add your first item above.
          </div>
        ) : (
          items.map((it) => {
            const isEditing = editingId === it.id;
            return (
              <div key={it.id} className="card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 text-neutral-500">≡</div>
                    <div className="font-semibold truncate">{it.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-ghost" onClick={() => (isEditing ? setEditingId(null) : startEdit(it))}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => deleteItem(it.id)}>
                      Delete
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Item name</label>
                      <input
                        className="input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); saveEdit(it.id); }
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                      <input
                        className="input"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); saveEdit(it.id); }
                        }}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                      <button className="btn btn-primary" onClick={() => saveEdit(it.id)}>Save</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
