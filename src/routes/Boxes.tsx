import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as Store from "@/store";

type Box = {
  id: string;
  moveId: string;
  name: string;
};

type Item = {
  id: string;
  boxId: string;
};

/* compat helpers */
async function call(name: string, ...args: any[]) {
  const fn = (Store as any)[name];
  if (typeof fn === "function") return await fn(...args);
  return undefined;
}

async function listBoxesCompat(moveId: string): Promise<Box[]> {
  return (
    (await call("listBoxes", moveId)) ??
    (await call("getBoxesByMoveId", moveId)) ??
    []
  );
}

async function listItemsInBoxCompat(boxId: string): Promise<Item[]> {
  return (
    (await call("listItemsInBox", boxId)) ??
    (await call("getItemsByBoxId", boxId)) ??
    []
  );
}

async function createBoxCompat(moveId: string, payload: { name: string }): Promise<Box> {
  return (
    (await call("createBox", moveId, payload)) ??
    (await call("addBox", moveId, payload.name)) ??
    (await call("newBox", { moveId, name: payload.name }))
  );
}

async function deleteBoxCompat(id: string) {
  return (
    (await call("deleteBox", id)) ??
    (await call("removeBox", id)) ??
    (await call("deleteBoxById", id)) ??
    (await call("destroyBox", id))
  );
}

export default function Boxes() {
  const { moveId } = useParams();
  const nav = useNavigate();
  const [boxes, setBoxes] = useState<Array<Box & { itemCount: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const list = (await listBoxesCompat(String(moveId))) || [];
      const withCounts = await Promise.all(
        list.map(async (b) => {
          const items = await listItemsInBoxCompat(b.id);
          return { ...b, itemCount: (items || []).length };
        })
      );
      if (alive) {
        setBoxes(withCounts);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [moveId]);

  async function addBox() {
    const name = newName.trim();
    if (!name) return;
    setNewName("");
    const created = await createBoxCompat(String(moveId), { name });
    nav(`/moves/${moveId}/boxes/${created.id}`);
  }

  function onAddKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addBox();
    }
  }

  async function deleteBox(id: string) {
    if (!confirm("Delete this box?")) return;
    await deleteBoxCompat(id);
    const remaining = (await listBoxesCompat(String(moveId))) || [];
    const withCounts = await Promise.all(
      remaining.map(async (b) => {
        const items = await listItemsInBoxCompat(b.id);
        return { ...b, itemCount: (items || []).length };
      })
    );
    setBoxes(withCounts);
  }

  if (loading) return <div className="p-4 text-neutral-600">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Boxes</h1>

      <div className="card p-4 space-y-3">
        <input
          className="input"
          placeholder="Box name (e.g., Kitchen #1)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={onAddKey}
        />
        <button className="btn btn-primary" onClick={addBox}>
          Add Box (Enter)
        </button>
      </div>

      {boxes.length === 0 ? (
        <div className="card p-4 text-neutral-600">No boxes yet. Add one above.</div>
      ) : (
        <div className="space-y-3">
          {boxes.map((b) => (
            <div key={b.id} className="card p-4">
              <div className="flex items-center justify-between gap-3">
                <Link
                  to={`/moves/${moveId}/boxes/${b.id}`}
                  className="font-semibold hover:underline truncate"
                >
                  {b.name}
                </Link>
                <div className="flex items-center gap-3">
                  <span className="badge badge-sm">Items: {b.itemCount}</span>
                  <button className="btn btn-danger" onClick={() => deleteBox(b.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
