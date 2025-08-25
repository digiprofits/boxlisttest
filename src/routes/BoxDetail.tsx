import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import * as Store from "@/store";

/* ───────── Types ───────── */
type Box = {
  id: string;
  moveId: string;
  name: string;
  status?: string;
  images?: string[];
};

type Item = {
  id: string;
  boxId: string;
  name: string;
  notes?: string;
  updatedAt?: number;
};

const STATUS = ["Open", "Packed", "Sealed", "Unpacked"] as const;

/* ───────── Component ───────── */
export default function BoxDetail() {
  const { moveId, boxId } = useParams();
  const nav = useNavigate();

  const [box, setBox] = useState<Box | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Add item
  const [newItemName, setNewItemName] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  // Edit item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Load box + items
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const b = await Store.getBoxById(String(boxId));
      const its = await Store.listItemsInBox(String(boxId));
      if (alive) {
        setBox(b || null);
        setItems((its || []).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [boxId]);

  const boxName = box?.name ?? "";

  function saveAndReturn() {
    // No pending async to flush; all updates are applied on change/blur.
    nav(`/moves/${moveId}/boxes`);
  }

  // Box name edits
  async function onNameBlur(e: React.FocusEvent<HTMLInputElement>) {
    const next = e.target.value.trim() || "Untitled";
    if (!box || next === box.name) return;
    await Store.updateBox(box.id, { name: next });
    setBox({ ...box, name: next });
  }

  // Status edits
  async function onStatusChange(next: string) {
    if (!box) return;
    const prev = box.status;
    setBox({ ...box, status: next });
    try {
      await Store.updateBox(box.id, { status: next });
    } catch {
      setBox((b) => (b ? { ...b, status: prev } : b));
      alert("Could not update status. Try again.");
    }
  }

  // Images
  function openImage(src: string) {
    window.open(src, "_blank");
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    if (!box) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      await Store.addBoxImage(box.id, dataUrl);
      setBox((b) => (b ? { ...b, images: [...(b.images || []), dataUrl] } : b));
    };
    reader.readAsDataURL(file);
    e.currentTarget.value = "";
  }

  async function removeImage(src: string) {
    if (!box) return;
    await Store.removeBoxImage(box.id, src);
    setBox((b) => (b ? { ...b, images: (b.images || []).filter((s) => s !== src) } : b));
  }

  // Items
  async function addItem() {
    if (!box) return;
    const name = newItemName.trim();
    const notes = newItemNotes.trim();
    if (!name) {
      nameRef.current?.focus();
      return;
    }
    const created = await Store.createItem({ boxId: box.id, name, notes });
    const now = Date.now();
    setItems((prev) => [{ ...created, updatedAt: now }, ...prev]);
    setNewItemName("");
    setNewItemNotes("");
    nameRef.current?.focus();
  }

  function onNewItemNameKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem();
    }
  }

  function startEdit(it: Item) {
    setEditingId(it.id);
    setEditName(it.name);
    setEditNotes(it.notes || "");
  }

  async function saveEdit(id: string) {
    const patch = {
      name: (editName || "").trim() || "Untitled",
      notes: (editNotes || "").trim(),
      updatedAt: Date.now(),
    };
    await Store.updateItem(id, patch);
    setItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, ...patch } : i))
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    );
    setEditingId(null);
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this item?")) return;
    await Store.deleteItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  if (loading) return <div className="p-4 text-neutral-600">Loading...</div>;
  if (!box)
    return (
      <div className="p-4 space-y-3">
        <div className="text-neutral-600">Box not found.</div>
        <button className="btn btn-primary" onClick={() => nav(`/moves/${moveId}/boxes`)}>
          Back to Boxes
        </button>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Top-left: Save and Return (replaces old Back + 'Box') */}
      <div className="flex items-center">
        <button className="btn btn-ghost" onClick={saveAndReturn} aria-label="Save and Return">
          ← Save and Return
        </button>
      </div>

      {/* Box header + status + images */}
      <div className="card p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Box name</label>
          <input
            className="input"
            defaultValue={boxName}
            onBlur={onNameBlur}
            placeholder="e.g., Kitchen #1"
          />
        </div>

        <div>
          <div className="text-neutral-600 mb-1">Status</div>
          <select
            className="input"
            value={box.status || "Open"}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-neutral-600 mb-2">Box Images</div>
          {box.images?.length ? (
            <div className="flex flex-wrap gap-3">
              {box.images.map((src) => (
                <div key={src} className="relative">
                  <img
                    src={src}
                    alt=""
                    className="h-28 w-28 rounded-xl object-cover border border-neutral-200"
                    onClick={() => openImage(src)}
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
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={onNewItemNameKey}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <input
            className="input"
            placeholder="Glass / fragile"
            value={newItemNotes}
            onChange={(e) => setNewItemNotes(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
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
          <div className="card p-4 text-neutral-600">No items yet. Add your first item above.</div>
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
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveEdit(it.id);
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                      <input
                        className="input"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveEdit(it.id);
                          }
                        })}
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
