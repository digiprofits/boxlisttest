import { create } from 'zustand';
import { db } from './db';
import type { MoveRecord, BoxRecord, ItemRecord, RoomRecord, BoxStatus } from './types';
import { customAlphabet } from 'nanoid/non-secure';

const nanoid = customAlphabet('1234567890abcdef', 10);

/* ---------------- UI STATE ---------------- */
type UIState = {
  currentMoveId: string | null;
  setCurrentMove: (id: string | null) => void;
};
export const useUI = create<UIState>((set) => ({
  currentMoveId: null,
  setCurrentMove: (id) => set({ currentMoveId: id }),
}));

/* ---------------- HELPERS ---------------- */
const PAD = 2;

async function ensureUnassignedRoom(moveId: string): Promise<RoomRecord> {
  const existing = await db.rooms
    .where('moveId')
    .equals(moveId)
    .and((r) => r.name === 'Unassigned')
    .first();
  if (existing) return existing;
  const now = Date.now();
  const room: RoomRecord = {
    id: nanoid(),
    moveId,
    name: 'Unassigned',
    createdAt: now,
    updatedAt: now,
  };
  await db.rooms.add(room);
  return room;
}

export async function nextBoxNumber(moveId: string): Promise<string> {
  const list = await db.boxes.where('moveId').equals(moveId).toArray();
  const nums = list
    .map((b) => parseInt(String(b.number), 10))
    .filter((n) => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return String(max + 1).padStart(PAD, '0');
}

export async function isBoxNumberTaken(
  moveId: string,
  number: string,
  excludeBoxId?: string
): Promise<boolean> {
  const found = await db.boxes
    .where('moveId')
    .equals(moveId)
    .and((b) => b.number === number && b.id !== excludeBoxId)
    .first();
  return !!found;
}

/* ---------------- MOVES ---------------- */
export async function createMove(name: string, notes?: string) {
  const id = nanoid(),
    now = Date.now();
  const move: MoveRecord = { id, name, notes, createdAt: now, updatedAt: now };
  await db.moves.add(move);
  return move;
}

export async function updateMove(id: string, patch: Partial<MoveRecord>) {
  patch.updatedAt = Date.now();
  await db.moves.update(id, patch);
}

export async function deleteMove(id: string) {
  const [rooms, boxes] = await Promise.all([
    db.rooms.where('moveId').equals(id).toArray(),
    db.boxes.where('moveId').equals(id).toArray(),
  ]);
  await db.transaction('rw', db.moves, db.rooms, db.boxes, db.items, async () => {
    for (const b of boxes) await db.items.where('boxId').equals(b.id).delete();
    await db.boxes.where('moveId').equals(id).delete();
    await db.rooms.where('moveId').equals(id).delete();
    await db.moves.delete(id);
  });
}

export async function listMoves() {
  const list = await db.moves.toArray();
  return list.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getMove(id: string) {
  return db.moves.get(id);
}

/* ---------------- ROOMS ---------------- */
export async function createRoom(moveId: string, name: string) {
  const now = Date.now();
  const room: RoomRecord = {
    id: nanoid(),
    moveId,
    name,
    createdAt: now,
    updatedAt: now,
  };
  await db.rooms.add(room);
  return room;
}

export async function updateRoom(id: string, patch: Partial<RoomRecord>) {
  patch.updatedAt = Date.now();
  await db.rooms.update(id, patch);
}

export async function deleteRoom(id: string) {
  const boxes = await db.boxes.where('roomId').equals(id).toArray();
  await db.transaction('rw', db.rooms, db.boxes, db.items, async () => {
    for (const b of boxes) await db.items.where('boxId').equals(b.id).delete();
    await db.boxes.where('roomId').equals(id).delete();
    await db.rooms.delete(id);
  });
}

export async function listRooms(moveId: string) {
  const list = await db.rooms.where('moveId').equals(moveId).toArray();
  return list.sort(
    (a, b) =>
      (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
      a.name.localeCompare(b.name)
  );
}

export async function getRoom(id: string) {
  return db.rooms.get(id);
}

/* ---------------- BOXES ---------------- */
export async function createBox(
  moveId: string,
  roomIdOrName: string,
  name?: string
) {
  const now = Date.now();
  let roomId = roomIdOrName;
  if (!name && roomIdOrName && typeof roomIdOrName === 'string') {
    name = roomIdOrName;
    const r = await ensureUnassignedRoom(moveId);
    roomId = r.id;
  }
  if (!roomId) {
    const r = await ensureUnassignedRoom(moveId);
    roomId = r.id;
  }
  const number = await nextBoxNumber(moveId);
  if (await isBoxNumberTaken(moveId, number))
    return { error: 'DUPLICATE_NUMBER' } as const;

  const box: BoxRecord = {
    id: nanoid(),
    moveId,
    roomId,
    number,
    name: name || 'New Box',
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };
  await db.boxes.add(box);
  return box;
}

export async function addBox(moveId: string, name: string) {
  return createBox(moveId, name);
}
export async function newBox(moveId: string, name: string) {
  return createBox(moveId, name);
}

export async function listBoxes(moveId: string) {
  const boxes = await db.boxes.where('moveId').equals(moveId).toArray();
  return boxes.sort((a, b) =>
    a.number.localeCompare(b.number, undefined, { numeric: true })
  );
}

export async function listBoxesInRoom(roomId: string) {
  const boxes = await db.boxes.where('roomId').equals(roomId).toArray();
  return boxes.sort((a, b) =>
    a.number.localeCompare(b.number, undefined, { numeric: true })
  );
}

export async function getBox(id: string) {
  return db.boxes.get(id);
}
export async function getBoxById(id: string) {
  return getBox(id);
}

export async function renameBox(id: string, name: string) {
  return updateBox(id, { name });
}
export async function updateBoxStatus(id: string, status: BoxStatus) {
  return updateBox(id, { status });
}

export async function updateBox(id: string, patch: Partial<BoxRecord>) {
  const cur = await db.boxes.get(id);
  if (!cur) return { ok: false } as const;
  const nextNumber = patch.number ?? cur.number;
  if (nextNumber !== cur.number) {
    if (await isBoxNumberTaken(cur.moveId, String(nextNumber), id))
      return { ok: false, error: 'DUPLICATE_NUMBER' } as const;
  }
  const nx = { ...patch, updatedAt: Date.now() } as Partial<BoxRecord>;
  await db.boxes.update(id, nx);
  return { ok: true } as const;
}

export async function deleteBox(id: string) {
  await db.transaction('rw', db.boxes, db.items, async () => {
    await db.items.where('boxId').equals(id).delete();
    await db.boxes.delete(id);
  });
}
export async function deleteBoxById(id: string) {
  return deleteBox(id);
}
export async function removeBox(id: string) {
  return deleteBox(id);
}
export async function destroyBox(id: string) {
  return deleteBox(id);
}

export async function addBoxImage(id: string, src: string) {
  const b = await db.boxes.get(id);
  if (!b) return;
  const images = Array.from(new Set([...(b.images ?? []), src]));
  await db.boxes.update(id, { images, updatedAt: Date.now() });
}
export async function appendBoxImage(id: string, src: string) {
  return addBoxImage(id, src);
}
export async function removeBoxImage(id: string, src: string) {
  const b = await db.boxes.get(id);
  if (!b) return;
  const images = (b.images ?? []).filter((x) => x !== src);
  await db.boxes.update(id, { images, updatedAt: Date.now() });
}
export async function deleteBoxImage(id: string, src: string) {
  return removeBoxImage(id, src);
}

/* ---------------- ITEMS ---------------- */
export async function listItemsInBox(boxId: string) {
  return db.items.where('boxId').equals(boxId).toArray();
}
export async function listAllItemsInMove(moveId: string) {
  return db.items.where('moveId').equals(moveId).toArray();
}

export async function createItem({
  name,
  notes,
  boxId,
}: {
  name: string;
  notes?: string;
  boxId: string;
}) {
  const now = Date.now();
  const box = await db.boxes.get(boxId);
  if (!box) return;
  const it: ItemRecord = {
    id: nanoid(),
    moveId: box.moveId,
    boxId,
    name,
    notes,
    createdAt: now,
    updatedAt: now,
  };
  await db.items.add(it);
  await db.boxes.update(boxId, { updatedAt: now });
  return it;
}

export async function addItemToBox(
  boxId: string,
  { name, notes }: { name: string; notes?: string }
) {
  return createItem({ name, notes, boxId });
}
export async function addItem(
  boxId: string,
  { name, notes }: { name: string; notes?: string }
) {
  return createItem({ name, notes, boxId });
}

export async function saveItem(id: string, item: ItemRecord) {
  await db.items.put(item);
}
export async function updateItem(id: string, patch: Partial<ItemRecord>) {
  patch.updatedAt = Date.now();
  await db.items.update(id, patch);
}
export async function removeItem(id: string) {
  await db.items.delete(id);
}
export async function deleteItem(id: string) {
  await db.items.delete(id);
}

/* ---------------- EXPORT / IMPORT (Settings.tsx) ---------------- */
type ExportBundle = {
  version: number;
  exportedAt: number;
  data: {
    moves: MoveRecord[];
    rooms: RoomRecord[];
    boxes: BoxRecord[];
    items: ItemRecord[];
  };
};

/** Export all data as a JSON string (pretty-printed) */
export async function exportJSON(): Promise<string> {
  const [moves, rooms, boxes, items] = await Promise.all([
    db.moves.toArray(),
    db.rooms.toArray(),
    db.boxes.toArray(),
    db.items.toArray(),
  ]);
  const bundle: ExportBundle = {
    version: 2,
    exportedAt: Date.now(),
    data: { moves, rooms, boxes, items },
  };
  return JSON.stringify(bundle, null, 2);
}

/**
 * Import data from a JSON string or object.
 * mode = 'replace' (default) clears existing data before import.
 * mode = 'merge' upserts by id (keeps existing when ids match).
 */
export async function importJSON(
  payload: string | Partial<ExportBundle>,
  opts: { mode?: 'replace' | 'merge' } = {}
): Promise<{ ok: true } | { ok: false; error: string }> {
  const mode = opts.mode ?? 'replace';
  let parsed: Partial<ExportBundle>;
  try {
    parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
  } catch (e) {
    return { ok: false, error: 'INVALID_JSON' };
  }
  const data = parsed?.data ?? {};
  const moves = (data.moves ?? []) as MoveRecord[];
  const rooms = (data.rooms ?? []) as RoomRecord[];
  const boxes = (data.boxes ?? []) as BoxRecord[];
  const items = (data.items ?? []) as ItemRecord[];

  try {
    if (mode === 'replace') {
      await db.transaction('rw', db.moves, db.rooms, db.boxes, db.items, async () => {
        await Promise.all([db.items.clear(), db.boxes.clear(), db.rooms.clear(), db.moves.clear()]);
        if (moves.length) await db.moves.bulkAdd(moves);
        if (rooms.length) await db.rooms.bulkAdd(rooms);
        if (boxes.length) await db.boxes.bulkAdd(boxes);
        if (items.length) await db.items.bulkAdd(items);
      });
    } else {
      // merge (upsert by id)
      await db.transaction('rw', db.moves, db.rooms, db.boxes, db.items, async () => {
        for (const m of moves) await db.moves.put(m);
        for (const r of rooms) await db.rooms.put(r);
        for (const b of boxes) await db.boxes.put(b);
        for (const it of items) await db.items.put(it);
      });
    }
    return { ok: true };
  } catch (e) {
    console.error('importJSON failed', e);
    return { ok: false, error: 'IMPORT_FAILED' };
  }
}
