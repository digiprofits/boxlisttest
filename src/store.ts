import { create } from 'zustand';
import { db } from './db';
import type { MoveRecord, BoxRecord, ItemRecord, BoxStatus } from './types';
import { customAlphabet } from 'nanoid/non-secure';
const nanoid = customAlphabet('1234567890abcdef', 10);

type UIState = { currentMoveId:string|null; setCurrentMove:(id:string|null)=>void };
export const useUI = create<UIState>((set)=>({ currentMoveId:null, setCurrentMove:(id)=>set({currentMoveId:id}) }));

// Moves
export async function createMove(name:string, notes?:string){
  const id=nanoid(), now=Date.now();
  const move:MoveRecord={ id,name,notes,createdAt:now,updatedAt:now };
  await db.moves.add(move); return move;
}
export async function updateMove(id:string, patch:Partial<MoveRecord>){ patch.updatedAt=Date.now(); await db.moves.update(id,patch); }
export async function deleteMove(id:string){
  await db.transaction('rw',db.moves,db.boxes,db.items,async()=>{
    await db.items.where('moveId').equals(id).delete();
    await db.boxes.where('moveId').equals(id).delete();
    await db.moves.delete(id);
  });
}
export async function listMoves(){ return db.moves.orderBy('updatedAt').reverse().toArray(); }

// Boxes
export async function createBox(moveId:string, payload:Partial<BoxRecord>){
  const id=nanoid(), now=Date.now();
  const box:BoxRecord={ id, moveId, name:payload.name||'New Box', status:(payload.status||'open') as BoxStatus,
    notes:payload.notes, images:payload.images||[], createdAt:now, updatedAt:now };
  await db.boxes.add(box); return box;
}
export async function updateBox(id:string, patch:Partial<BoxRecord>){ patch.updatedAt=Date.now(); await db.boxes.update(id,patch); }
export async function deleteBox(id:string){
  await db.transaction('rw',db.boxes,db.items,async()=>{
    await db.items.where('boxId').equals(id).delete();
    await db.boxes.delete(id);
  });
}
export async function listBoxes(moveId:string){ return (await db.boxes.where('moveId').equals(moveId).toArray()).sort((a,b)=>b.updatedAt-a.updatedAt); }

// Items
export async function createItem(moveId:string, boxId:string, payload:Partial<ItemRecord>){
  const id=nanoid(), now=Date.now();
  const item:ItemRecord={ id, moveId, boxId, name:payload.name||'New Item', notes:payload.notes, order: now, createdAt: now, updatedAt: now };
  await db.items.add(item); return item;
}
export async function updateItem(id:string, patch:Partial<ItemRecord>){ patch.updatedAt=Date.now(); await db.items.update(id,patch); }
export async function deleteItem(id:string){ await db.items.delete(id); }
export async function listItemsInBox(boxId:string){ return (await db.items.where('boxId').equals(boxId).toArray()).sort((a,b)=>b.order-a.order); }
export async function listAllItemsInMove(moveId:string){ return (await db.items.where('moveId').equals(moveId).toArray()).sort((a,b)=>b.order-a.order); }
export async function moveItemToBox(itemId:string, targetBoxId:string){ await db.items.update(itemId, { boxId: targetBoxId, updatedAt: Date.now() }); }
export async function reorderItems(itemIdsInOrder:string[]){
  const now=Date.now(); let step=0;
  await db.transaction('rw',db.items,async()=>{
    for(const id of itemIdsInOrder){
      await db.items.update(id, { order: now + (itemIdsInOrder.length - step), updatedAt: Date.now() });
      step++;
    }
  });
}

// Export/Import unchanged from previous build if you had it…
export async function exportJSON(){
  const [moves,boxes,items] = await Promise.all([db.moves.toArray(), db.boxes.toArray(), db.items.toArray()]);
  return { version: 2, exportedAt: new Date().toISOString(), moves, boxes, items };
}
export async function importJSON(data:any){
  if(!data || !Array.isArray(data.moves)) return;
  await db.transaction('rw',db.moves,db.boxes,db.items,async()=>{
    for(const m of data.moves) await db.moves.put(m);
    for(const b of data.boxes) await db.boxes.put(b);
    for(const i of data.items) await db.items.put(i);
  });
}
