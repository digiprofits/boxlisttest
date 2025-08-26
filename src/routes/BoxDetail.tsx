import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { nanoid } from "nanoid";
import * as Store from "@/store";

/* ─────────────────────────── Types ─────────────────────────── */
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

const STATUS_OPTIONS = ["Open", "Packed", "Sealed", "Unpacked"] as const;

/* ─────────────────────── Helper: safe store call ─────────────────────── */
async function call(fn: string, ...args: any[]) {
  const f = (Store as any)[fn];
  if (typeof f === "function") return await f(...args);
  return undefined;
}

/* ────────────────────────── Component ────────────────────────── */
export default function BoxDetailRoute() {
  const { moveId, boxId } = useParams();
  if (!moveId || !boxId) return <div className="p-4">Box not found.</div>;
  return <BoxDetail moveId={moveId} boxId={boxId} />;
}

/* ╔════════════════════════  DETAIL  ═════════════════════════╗ */
function BoxDetail({ moveId, boxId }: { moveId: string; boxId: string }) {
  const nav = useNavigate();

  const [box, setBox] = useState<Box | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [newItemName, setNewItemName] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);

        let found: Box | undefined =
          ((await call("getBox", boxId)) as Box) ||
          ((await call("getBoxById", boxId)) as Box);

        if (!found) {
          const list: Box[] = (await call("listBoxes", moveId)) || [];
          found = list.find((b) => b.id === boxId);
        }

        const listItems: Item[] = ((await call("listItemsInBox", boxId)) || []).sort(
          (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
        );

        if (!alive) return;
        setBox(found ?? null);
        setItems(listItems);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
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
        call("updateBoxStatus", box.id, next) ??
        call("updateBox", box.id, { status: next }) ??
        call("saveBox", { ...box, status: next })
      );
    } catch {
      setBox((b) => (b ? { ...b, status: prev } : b));
      alert("Could not update status. Try again.");
    }
  }

  function openImageFull(url: string) {
    window.open(url, "_blank");
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !box) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      try {
        await (
          call("addBoxImage", box.id, dataUrl) ??
          call("appendBoxImage", box.id, dataUrl)
        );
        setBox((prev) =>
          prev ? { ...prev, images: [...(prev.images || []), dataUrl] } : prev
        );
      } catch {
        alert("Failed to add image.");
      }
    };
    reader.readAsDataURL(file);
    e.currentTarget.value = "";
  }

  async function removeImage(img: string) {
    if (!box) return;
    try {
      await (call("removeBoxImage", box.id, img) ??
        call("deleteBoxImage", box.id, img));
      setBox((prev) =>
        prev ? { ...prev, images: (prev.images || []).filter((u) => u !== img) } : prev
      );
    } catch {
      alert("Failed to remove image.");
    }
  }

  // robust id generator across older browsers
  const genId = () =>
    (typeof crypto !== "undefined" && (crypto as any).randomUUID
      ? (crypto as any).randomUUID()
      : nanoid());

  async function addItem() {
    if (!box) return;
    const name = newItemName.trim();
    if (!name) {
      nameRef.current?.focus();
      return;
    }
    const notes = newItemNotes.trim();
    const newIt: Item = {
      id: genId(),
      boxId: box.id,
      name,
      notes,
      updatedAt: Date.now(),
    };

    try {
      // Try the possible store APIs we’ve seen
      await (
        call("addItemToBox", box.id, { name, notes }) ??
        call("createItem", { ...newIt }) ??
        call("createItem", newIt) ??
        call("saveItem", newIt) ??
        call("saveItem", newIt.id, newIt)
      );
    } catch (err) {
      // Log but don’t block optimistic UI
      console.error("addItem store error:", err);
    }

    // Optimistic UI (and ensures Enter feels snappy)
    setItems((prev) => [newIt, ...prev]);
    setNewItemName("");
    setNewItemNotes("");
    nameRef.current?.focus();
  }

  function onNameKey(e: React.KeyboardEvent<HTMLInputElement>) {
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
      name: editName.trim() || "Untitled",
      notes: editNotes.trim(),
      updatedAt: Date.now(),
    };
    try {
      await (call("updateItem", id, patch) ?? call("saveItem", id, patch) ?? call("saveItem", { id, ...patch }));
    } catch (err) {
      console.error("saveEdit error:", err);
    }
    setItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, ...patch } : it))
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    );
    setEditingId(null);
  }

  async function deleteItem(id: string) {
    if (!confirm("Delete this item?")) return;
    try {
      await (call("removeItem", id) ?? call("deleteItem", id));
    } catch (err) {
      console.error("deleteItem error:", err);
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
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
      {/* Top-left Save & Return */}
      <div className="flex items-center">
        <button className="btn btn-ghost" onClick={saveAndReturn} aria-label="Save and Return">
          ← Save and Return
        </button>
      </div>

      {/* Box header card */}
      <div className="card p-4 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold">{box.name}</h2>

        {/* Status */}
        <div>
          <div className="text-neutral-600 mb-1">Status</div>
          <select
            className="input"
            value={box.status || "Open"}
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
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={onNameKey}
            inputMode="text"
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
            inputMode="text"
          />
        </div>
        <div>
          <button type="button" className="btn btn-primary" onClick={addItem}>
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
                          if (e.key === "Enter") {
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
                          if (e.key === "Enter") {
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
