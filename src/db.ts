import Dexie, { Table } from 'dexie';
// v1 (legacy) — moves, boxes, items only (old keypaths/indexes)
this.version(1).stores({
moves: 'id, name, updatedAt',
boxes: 'id, moveId, name, status, updatedAt',
items: 'id, moveId, boxId, name, updatedAt'
});


// v2 — introduce rooms + box.number + box.roomId
this.version(2).stores({
moves: 'id, name, updatedAt',
rooms: 'id, moveId, name, sortOrder, updatedAt',
boxes: 'id, moveId, roomId, number, name, status, updatedAt',
items: 'id, moveId, boxId, name, updatedAt'
}).upgrade(async (tx) => {
// Create an "Unassigned" room per move, attach boxes without roomId, and assign numbers per move if missing.
const moves = await tx.table('moves').toArray() as MoveRecord[];
const boxes = await tx.table('boxes').toArray() as any[]; // may be old shape


const unassignedByMove: Record<string, RoomRecord> = {};
const now = Date.now();


for (const mv of moves) {
const room: RoomRecord = {
id: crypto.randomUUID(),
moveId: mv.id,
name: 'Unassigned',
createdAt: now,
updatedAt: now,
};
await tx.table('rooms').add(room);
unassignedByMove[mv.id] = room;
}


// Compute next number per move
const nextByMove: Record<string, number> = {};


for (const b of boxes) {
// Ensure moveId exists (legacy always had it)
const moveId = b.moveId;
// Attach roomId if missing
if (!b.roomId && unassignedByMove[moveId]) {
b.roomId = unassignedByMove[moveId].id;
}
// Ensure status
if (!b.status) b.status = 'open';
// Prepare to assign/normalize number
let n = parseInt(String(b.number ?? ''), 10);
if (Number.isNaN(n)) n = 0;
nextByMove[moveId] = Math.max(nextByMove[moveId] ?? 0, n);
}


for (const b of boxes) {
const moveId = b.moveId;
if (!b.number || String(b.number).trim() === '' || String(b.number) === '0') {
const next = (nextByMove[moveId] ?? 0) + 1;
nextByMove[moveId] = next;
b.number = String(next).padStart(2, '0');
} else {
// normalize padding to at least 2
const n = parseInt(String(b.number), 10);
if (!Number.isNaN(n)) b.number = String(n).padStart(2, '0');
}
await tx.table('boxes').put(b);
}
});
}
}


export const db = new BoxDB();
