import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as Store from '@/store'; // safer than named imports across refactors

type Row = {
  id: string;
  name: string;
  notes?: string;
  boxId: string;
  boxName: string;
  updatedAt?: number;
};

function formatDateShort(ts?: number) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const base = d.toLocaleDateString(undefined, opts);
  return d.getFullYear() !== now.getFullYear() ? `${base}, ${d.getFullYear()}` : base;
}

export default function Items() {
  const { moveId } = useParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editBoxId, setEditBoxId] = useState<string>('');

  // Load boxes and items for this move
  useEffect(() => {
    if (!moveId) return;
    (async () => {
      const bxs: any[] = await (Store as any).listBoxes(moveId);
      setBoxes(bxs);

      const all: Row[] = [];
      for (const b of bxs) {
        const its: any[] = await (Store as any).listItemsInBox(b.id);
        for (const it of its) {
          all.push({
            id: it.id,
            name: it.name,
            notes: it.notes,
            boxId: b.id,
            boxName: b.name,
            updatedAt: it.updatedAt,
          });
        }
      }
      // newest first
      all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setRows(all);
    })();
  }, [moveId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.boxName.toLowerCase().includes(q) ||
        (r.notes || '').toLowerCase().includes(q),
    );
  }, [rows, query]);

  function startEdit(item: Row) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditNotes(item.notes || '');
    setEditBoxId(item.boxId);
  }

  async function saveEdit(id: string) {
    await (Store as any).updateItem(id, {
      name: editName.trim() || 'Untitled',
      notes: editNotes.trim(),
      boxId: editBoxId,
      updatedAt: Date.now(),
    });
    setRows((prev) =>
      prev
        .map((r) =>
          r.id === id
            ? {
                ...r,
                name: editName.trim() || 'Untitled',
                notes: editNotes.trim(),
                boxId: editBoxId,
                boxName: boxes.find((b) => b.id === editBoxId)?.name || r.boxName,
                updatedAt: Date.now(),
              }
            : r,
        )
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    );
    setEditingId(null);
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this item?')) return;
    await (Store as any).removeItem(id);
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-bold">Items</h1>

      <input
        className="input"
        placeholder="Search items..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length === 0 ? (
        <div className="card p-4 text-neutral-600">No items found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isEditing = editingId === item.id;
            return (
              <div key={item.id} className="card p-4">
                {/* Row header: name (left) • box link, date, edit, delete (right) */}
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg truncate">{item.name}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Box link */}
                    <Link
                      to={`/moves/${moveId}/boxes/${item.boxId}`}
                      className="text-blue-600 hover:underline font-medium"
                      title={`Open box: ${item.boxName}`}
                    >
                      {item.boxName}
                    </Link>

                    {/* Date (compact) */}
                    {item.updatedAt && (
                      <span className="badge badge-sm border-neutral-300 text-neutral-700">
                        {formatDateShort(item.updatedAt)}
                      </span>
                    )}

                    {/* Edit */}
                    <button
                      className="btn btn-ghost btn-icon"
                      aria-label="Edit item"
                      onClick={() => (isEditing ? setEditingId(null) : startEdit(item))}
                      title="Edit"
                    >
                      <svg className="icon" viewBox="0 0 24 24" fill="none">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M14.06 6.19l3.75 3.75" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </button>

                    {/* Delete */}
                    <button className="btn btn-danger btn-sm" onClick={() => deleteItem(item.id)}>
                      <svg className="icon mr-1" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M9 6V4h6v2M8 6v14h8V6" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>

                {/* Editing panel */}
                {isEditing && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Item name</label>
                      <input
                        className="input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g., Plates"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveEdit(item.id);
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
                        placeholder="Glass / fragile"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveEdit(item.id);
                          }
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Move to box</label>
                      <select
                        className="input"
                        value={editBoxId}
                        onChange={(e) => setEditBoxId(e.target.value)}
                      >
                        {boxes.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button className="btn btn-ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                      <button className="btn btn-primary" onClick={() => saveEdit(item.id)}>
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
