import { create } from 'zustand';
import { db } from './db';
import type { MoveRecord, BoxRecord, ItemRecord, RoomRecord, BoxStatus } from './types';
import { customAlphabet } from 'nanoid/non-secure';
const nanoid = customAlphabet('1234567890abcdef', 10);


/* ───────────────────────── UI State ───────────────────────── */
type UIState = { currentMoveId:string|null; setCurrentMove:(id:string|null)=>void };
export const useUI = create<UIState>((set)=>({ currentMoveId:null, setCurrentMove:(id)=>set({currentMoveId:id}) }));


/* ──────────────────────── Utilities ───────────────────────── */
const PAD = 2; // default pad width for box numbers


async function ensureUnassignedRoom(moveId: string): Promise<RoomRecord> {
const existing = await db.rooms.where('moveId').equals(moveId).and(r => r.name === 'Unassigned').first();
if (existing) return existing;
const now = Date.now();
const room: RoomRecord = { id: nanoid(), moveId, name: 'Unassigned', createdAt: now, updatedAt: now };
await db.rooms.add(room);
return room;
}


export async function nextBoxNumber(moveId: string): Promise<string> {
const list = await db.boxes.where('moveId').equals(moveId).toArray();
const nums = list.map(b => parseInt(String(b.number), 10)).filter(n => !Number.isNaN(n));
const max = nums.length ? Math.max(...nums) : 0;
return String(max + 1).padStart(PAD, '0');
}


export async function isBoxNumberTaken(moveId: string, number: string, excludeBoxId?: string): Promise<boolean> {
const found = await db.boxes.where('moveId').equals(moveId).and(b => b.number === number && b.id !== excludeBoxId).first();
return !!found;
}


/* ───────────────────────── Moves ──────────────────────────── */
export async function createMove(name:string, notes?:string){
const id=nanoid(), now=Date.now();
const move:MoveRecord={ id,name,notes,createdAt:now,updatedAt:now };
await db.moves.add(move); return move;
}
export async function updateMove(id:string, patch:Partial<MoveRecord>){ patch.updatedAt=Date.now(); await db.moves.update(id,patch); }
export async function deleteMove(id:string){
// cascade delete rooms, boxes, items in this move
const [rooms, boxes] = await Promise.all([
db.rooms.where('moveId').equals(id).toArray(),
db.boxes.where('moveId').equals(id).toArray(),
]);
await db.transaction('rw', db.moves, db.rooms, db.boxes, db.items, async ()=>{
for(const b of boxes){ await db.items.where('boxId').equals(b.id).delete(); }
await db.boxes.where('moveId').equals(id).delete();
await db.rooms.where('moveId').equals(id).delete();
await db.moves.delete(id);
});
}
export async function listMoves(){
}
