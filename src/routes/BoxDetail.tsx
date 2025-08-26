import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import * as Store from '@/store';
import { db } from '@/db';
import type { BoxStatus } from '@/types';

/** ───────────────── Types ───────────────── */
type Box = {
  id: string;
  moveId: string;
  name: string;
  status?: BoxStatus | string;
  images?: string[];
};

type Item = {
  id: string;
  moveId: string;
  boxId: string;
  name: string;
  notes?: string;
  updatedAt?: number;
};

const STATUS_OPTIONS: (BoxStatus | string)[] = ['Open','Packed','Sealed','Unpacked'];

/** ───────────────── Helpers ─────────────── */
async function call(fn: string, ...args: any[]) {
  const f = (Store as any)[fn];
  if (typeof f === 'function') {
    try { return await f(...args); } catch { /* ignore */ }
  }
  return undefined;
}

/** ───────────────── Component ───────────── */
export default function BoxDetail() {
  const { moveId = '', boxId = '' } = useParams();
  const nav = useNavigate();

  const [box, setBox] = useState<Box | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [newItemName, setNewItemName] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);

      // Load box
      let found: Box | undefined =
        (await call('getBox', boxId)) ||
        (await call('getBoxById', boxId));
      if (!found) {
        const list: Box[] = (await call('listBoxes', moveId)) || [];
        found = list.find(b => b.id === boxId);
      }
      // Load items
      let listItems: Item[] =
        (await call('listItemsInBox', boxId)) ||
        (await db.items?.where?.('boxId')?.equals?.(boxId)?.toArray?.()) ||
        [];
      listItems = listItems.sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0));

      if (!alive) return;
      setBox(found ?? null);
      setItems(listItems);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [moveId, boxId]);

  function saveAndReturn() {
    nav(`/moves/${moveId}/boxes`);
  }

  async function onStatusChange(next: string) {
    if (!box) return;
    const prev = box.status;
    setBox({ ...box, status: next });
    try {
      await (
        call('updateBoxStatus', box.id, next) ??
        call('updateBox', box.id, { status: next }) ??
        call('saveBox', { ...box, status: next })
      );
      // Fallback write-through
      try { await db.boxes?.update?.(box.id, { status: next, updatedAt: Date.now() }); } catch {}
    } catch {
      setBox((b) => (b ? { ...b, status: prev } : b));
      alert('Could not update status. Try again.');
    }
  }

  async function addItem() {
    if (!box) return;
    const name = newItemName.trim();
    if (!name) { nameRef.current?.focus(); return; }
    const notes = newItemNotes.trim();

    // optimistic
    const temp: Item = {
      id: crypto.randomUUID(),
      moveId,
      boxId: box.id,
      name,
      notes,
      updatedAt: Date.now(),
    };
    setItems(prev => [temp, ...prev]);
    setNewItemName('');
    setNewItemNotes('');
    nameRef.current?.focus();

    // Try store in several shapes
    let saved: any;
    saved = await call('addItem', moveId, box.id, name, notes);
    if (!saved) saved = await call('addItem', { moveId, boxId: box.id, name, notes });
    if (!saved) saved = await call('createItem', moveId, box.id, { name, notes });
    if (!saved) saved = await call('createItem', { moveId, boxId: box.id, name, notes });
    if (!saved) saved = await call('addItemToBox', box.id, { name, notes });
    if (!saved) {
      // Dexie fallback
      try { await db.items?.add?.(temp); } catch (e) { console.error('Dexie add failed', e); }
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item?')) return;
    setItems(prev => prev.filter(it => it.id !== id));
    await (call('deleteItem', id) ?? call('removeItem', id));
    try { await db.items?.delete?.(id); } catch {}
  }

  function startEdit(it: Item) {
    setEditingId(it.id);
    setEditName(it.name);
    setEditNotes(it.notes || '');
  }

  async function saveEdit(id: string) {
    const patch = { name: editName.trim() || 'Untitled', notes: editNotes.trim(), updatedAt: Date.now() };
    setItems(prev =>
      prev
        .map(it => it.id === id ? { ...it, ...patch } : it)
        .sort((a,b) => (b.updatedAt||0) - (a.updatedAt||0))
    );
    setEditingId(null);
    await (call('updateItem', id, patch) ?? call('saveItem', id, patch));
    try { await db.items?.update?.(id, patch); } catch {}
  }

  function openImageFull(url: string) { window.open(url, '_blank'); }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !box) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      setBox(prev => prev ? { ...prev, images: [...(prev.images||[]), dataUrl] } : prev);
      await (call('addBoxImage', box.id, dataUrl) ?? call('appendBoxImage', box.id, dataUrl));
      try {
        const next = (box.images || []).concat(dataUrl);
        await db.boxes?.update?.(box.id, { images: next, updatedAt: Date.now() });
      } catch {}
    };
    reader.readAsDataURL(file);
    e.currentTarget.value = '';
  }

  async function removeImage(img: string) {
    if (!box) return;
    setBox(prev => prev ? { ...prev, images: (prev.images||[]).filter(u => u !== img) } : prev);
    await (call('removeBoxImage', box.id, img) ?? call('deleteBoxImage', box.id, img));
    try {
      const next = (box.images || []).filter(u => u !== img);
      await db.boxes?.update?.(box.id, { images: next, updatedAt: Date.now() });
    } catch {}
  }

  if (loading) return <div className="p-4 text-neutral-600">Loading...</div>;
  if (!box) return <div className="p-4">Box not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <button className="btn btn-ghost" onClick={saveAndReturn} aria-label="Save and Return">← Save and Return</button>
      </div>

      <div className="card p-4 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold">{box.name}</h2>

        <div>
          <div className="text-neutral-600 mb-1">Status</div>
          <select className="input" value={box.status || 'Open'} onChange={(e)=>onStatusChange(e.target.value)}>
            {STATUS_OPTIONS.map(s => <option key={String(s)} value={String(s)}>{String(s)}</option>)}
          </select>
        </div>

        <div>
          <div className="text-neutral-600 mb-2">Box Images</div>
          {box.images && box.images.length ? (
            <div className="flex flex-wrap gap-3">
              {box.images.map(src => (
                <div key={src} className="relative">
                  <img src={src} alt="" className="h-28 w-28 rounded-xl object-cover border border-neutral-200" onClick={()=>openImageFull(src)}/>
                  <button className="btn btn-ghost btn-icon absolute -top-2 -right-2 bg-white/90" onClick={()=>removeImage(src)} aria-label="Remove image">✕</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-neutral-500">No images yet.</div>
          )}
          <div className="mt-2">
            <label className="btn btn-ghost cursor-pointer">
              Add Images
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPickImage}/>
            </label>
          </div>
        </div>
      </div>

      {/* ADD ITEM — now a form that submits on Enter */}
      <form
        className="card p-4 space-y-3"
        onSubmit={(e) => { e.preventDefault(); addItem(); }}
      >
        <div>
          <label className="block text-sm font-medium mb-1">Item name</label>
          <input
            ref={nameRef}
            className="input"
            placeholder="e.g., Plates"
            value={newItemName}
            onChange={(e)=>setNewItemName(e.target.value)}
            // catch both Enter and mobile “Next” (often behaves like Tab)
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                addItem();
              }
            }}
            enterKeyHint="done"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <input
            className="input"
            placeholder="Glass / fragile"
            value={newItemNotes}
            onChange={(e)=>setNewItemNotes(e.target.value)}
            onKeyDown={(e)=>{ if (e.key==='Enter'){ e.preventDefault(); addItem(); } }}
            enterKeyHint="done"
          />
        </div>
        <div>
          <button type="submit" className="btn btn-primary">Add Item (Enter)</button>
        </div>
      </form>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="card p-4 text-neutral-600">No items yet. Add your first item above.</div>
        ) : (
          items.map(it => {
            const isEditing = editingId === it.id;
            return (
              <div key={it.id} className="card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 text-neutral-500">≡</div>
                    <div className="font-semibold truncate">{it.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="btn btn-ghost" onClick={()=> (isEditing ? setEditingId(null) : startEdit(it))}>Edit</button>
                    <button className="btn btn-danger" onClick={()=>deleteItem(it.id)}>Delete</button>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Item name</label>
                      <input
                        className="input"
                        value={editName}
                        onChange={(e)=>setEditName(e.target.value)}
                        onKeyDown={(e)=>{ if (e.key==='Enter'){ e.preventDefault(); saveEdit(it.id); } }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                      <input
                        className="input"
                        value={editNotes}
                        onChange={(e)=>setEditNotes(e.target.value)}
                        onKeyDown={(e)=>{ if (e.key==='Enter'){ e.preventDefault(); saveEdit(it.id); } }}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button className="btn btn-ghost" onClick={()=>setEditingId(null)}>Cancel</button>
                      <button className="btn btn-primary" onClick={()=>saveEdit(it.id)}>Save</button>
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
