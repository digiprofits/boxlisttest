// src/db.ts
import Dexie, { Table } from 'dexie';
import type { MoveRecord, BoxRecord, ItemRecord, RoomRecord } from './types';
import { customAlphabet } from 'nanoid/non-secure';

const nanoid = customAlphabet('1234567890abcdef', 10);

export class BoxDB extends Dexie {
  moves!: Table<MoveRecord, string>;
  rooms!: Table<RoomRecord, string>;
  boxes!: Table<BoxRecord, string>;
  items!: Table<ItemRecord, string>;

  constructor() {
    super('boxlister_v2');

    // v1 (legacy)
    this.version(1).stores({
      moves: 'id, name, updatedAt',
      boxes: 'id, moveId, name, status, updatedAt',
      items: 'id, moveId, boxId, name, updatedAt',
    });

    // v2 — add rooms + box.number + roomId
    this.version(2)
      .stores({
        moves: 'id, name, updatedAt',
        rooms: 'id, moveId, name, sortOrder, updatedAt',
        boxes: 'id, moveId, roomId, number, name, status, updatedAt',
        items: 'id, moveId, boxId, name, updatedAt',
      })
      .upgrade(async (tx) => {
        const moves = (await tx.table('moves').toArray()) as MoveRecord[];
        const boxes = (await tx.table('boxes').toArray()) as any[];

        // Create "Unassigned" room per move
        const unassignedByMove: Record<string, RoomRecord> = {};
        const now = Date.now();

        for (const mv of moves) {
          const room: RoomRecord = {
            id: nanoid(),
            moveId: mv.id,
            name: 'Unassigned',
            createdAt: now,
            updatedAt: now,
          };
          await tx.table('rooms').add(room);
          unassignedByMove[mv.id] = room;
        }

        // Keep track of max number per move
        const maxByMove: Record<string, number> = {};

        // Pass 1: ensure roomId/status and discover maxima
        for (const b of boxes) {
          const moveId = b.moveId;
          if (!b.roomId && unassignedByMove[moveId]) {
            b.roomId = unassignedByMove[moveId].id;
          }
          if (!b.status) b.status = 'open';
          const asNum = parseInt(String(b.number ?? ''), 10);
          const n = Number.isNaN(asNum) ? 0 : asNum;
          maxByMove[moveId] = Math.max(maxByMove[moveId] ?? 0, n);
        }

        // Pass 2: assign/normalize numbers then persist
        for (const b of boxes) {
          const moveId = b.moveId;
          let num = parseInt(String(b.number ?? ''), 10);
          if (Number.isNaN(num) || num <= 0) {
            const next = (maxByMove[moveId] ?? 0) + 1;
            maxByMove[moveId] = next;
            b.number = String(next).padStart(2, '0');
          } else {
            b.number = String(num).padStart(2, '0');
          }
          await tx.table('boxes').put(b);
        }
      });
  }
}

export const db = new BoxDB();
