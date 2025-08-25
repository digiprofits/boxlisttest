import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as Store from '@/store';

type Box = {
  id: string;
  name: string;
  moveId: string;
  status?: string;
  images?: string[];
};

type Item = {
  id: string;
  name: string;
  notes?: string;
  boxId: string;
  updatedAt?: number;
};

const STATUS_OPTIONS = ['Open', 'Packed', 'Sealed', 'Unpacked'] as const;

// Safe wrapper to call whatever the store exposes
async function call(fn: string, ...args: any[]) {
  const f = (Store as any)[fn];
  if (typeof f === 'function') return await f(...args);
  return undefined;
}

export default function BoxView() {
  const nav = useNavigate();
  const { moveId, boxId } = useParams();

  const [box, setBox] = useState<Box | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Add-item form
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // ----------------- Load box + items (robust) -----------------
  useEffect(() => {
    let alive = true;

    (async () => {
      // Guard: no params → stop loading and show message
      if (!moveId || !boxId) {
        if (!alive) return;
        setLoading(false);
        setLoadError('No box selected.');
        return;
      }

      try {
        setLoading(true);
        setLoadError(null);

        // Try to find the box
        let found: Box | undefined;
        const list = (await call('listBoxes', moveId)) as Box[] | undefined;
        if (list) found = list.find((b) => b.id === boxId);
        if (!found) found = (await call('getBox', boxId)) as Box | undefined;
        if (!found) found = (await call('getBoxById', boxId)) as Box | undefined;

        if (!alive) return;
        setBox(found ?? null);

        // Load items for the box (if we have it)
        let loaded: Item[] = [];
        if (found) {
          loaded = (await call('listItemsInBox', boxId)) || [];
          loaded.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        }

        if (!alive) return;
        setItems(loaded);
      } catch (err: any) {
        if (!alive) return;
        setLoadError(err?.message || 'Failed to load box.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    // Safety: never let the loader sit forever
    const timer = setTimeout(() => {
      if (alive) setLoading(false);
    }, 6000);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [moveId, boxId]);

  // ----------------- Actions -----------------
  async function onStatusChange(next: string) {
    if (!box) return;
    setBox({ ...box, status: next }); // optimistic
    try {
      await call('updateBoxStatus', box.id, next) ??
        call('updateBox', box.id, { status: next }) ??
        call('saveBox', { ...box, status: next });
    } catch {
      // revert if it fails
      setBox((prev) => (prev ? { ...prev, status: box.status } : prev));
      alert('Could not update status. Please try again.');
    }
  }

  function openImageFull(url: string) {
    window.open(url, '_blank');
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !box) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      try {
        await (call('addBoxImage', box.id, dataUrl) ?? call('appendBoxImage', box.id, dataUrl));
        setBox((prev) =>
          prev ? { ...prev, images: [...(prev.images || []), dataUrl] } : prev,
        );
      } catch {
        alert('Failed to add image. Please try again.');
      }
    };
    reader.readAsDataURL(file);
    e.currentTarget.value = '';
  }

  async function removeImage(img: string) {
    if (!box) return;
    try {
      await (call('removeBoxImage', box.id, img) ?? call('deleteBoxImage', box.id, img));
      setBox((prev) =>
        prev ? { ...prev, images: (prev.images || []).filter((u) => u !== img) } : prev,
      );
    } catch {
      alert('Failed to remove image. Please try again.');
    }
  }

  async function addItem() {
    if (!box) return;
    const name = newName.trim();
    if (!name) {
      nameRef.current?.focus();
      return;
    }
    const notes = newNotes.trim();
    const payload = { name, notes, boxId: box.id, updatedAt: Date.now() };

    try {
      let created: Item | undefined =
        (await call('createItem', payload)) ||
        (await call('addItemToBox', box.id, { name, notes })) ||
        (await call('addItem', box.id, { name, notes }));

      if (!created) created = { id: crypto.randomUUID(), ...payload };

      setItems((prev) => [{ ...created! }, ...prev]);
      setNewName('');
      setNewNotes('');
      nameRef.current?.focus();
    } catch {
      alert('Failed to add item. Please try again.');
    }
  }

  function onNameKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  }

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
    try {
      await (call('updateItem', id, patch) ?? call('saveItem', id, patch));
      setItems((prev) =>
        prev
          .map((it) => (it.id === id ? { ...it, ...patch } : it))
          .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
      );
      setEditingId(null);
    } catch {
      alert('Failed to save item. Please try again.');
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item?')) return;
    try {
      await (call('removeItem', id) ?? call('deleteItem', id));
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch {
      alert('Failed to delete item. Please try again.');
    }
  }

  function saveAndExit() {
    // Data is already auto-saved; this just navigates.
    if (moveId) nav(`/moves/${moveId}/boxes`);
    else nav(-1);
  }

  // ----------------- Render -----------------
  if (loading) {
    return <div className="text-neutral-600 p-4">Loading...</div>;
  }
  if (loadError) {
    return (
      <div className="p-4 space-y-3">
        <div className="text-red-600 font-medium">{loadError}</div>
        <button className="btn btn-primary" onClick={() => (moveId ? nav(`/moves/${moveId}/boxes`) : nav(-1))}>
          Go back
        </button>
      </div>
    );
  }
  if (!box) {
    return (
      <div className="p-4 space-y-3">
        <div className="text-neutral-600">Box not found.</div>
        <button className="btn btn-primary" onClick={() => (moveId ? nav(`/moves/${moveId}/boxes`) : nav(-1))}>
          Back to Boxes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold">{box.name}</h2>
        </div>

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
                    <button
                      className="btn btn-ghost"
                      onClick={() => (isEditing ? setEditingId(null) : startEdit(it))}
                    >
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
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveEdit(it.id);
                          }
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
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveEdit(it.id);
                          }
                        }}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                      <button className="btn btn-primary" onClick={() => saveEdit(it.id)}>
                        Save
                      </button>
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
