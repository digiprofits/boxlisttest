import Dexie, { Table } from 'dexie';
import type { MoveRecord, RoomRecord, BoxRecord, ItemRecord, ImageRecord } from './types';

class AppDB extends Dexie {
  moves!: Table<MoveRecord, string>;
  rooms!: Table<RoomRecord, string>;
  boxes!: Table<BoxRecord, string>;
  items!: Table<ItemRecord, string>;
  images!: Table<ImageRecord, string>; // NEW

  constructor() {
    super('boxlister');
    // v1 — original schema
    this.version(1).stores({
      moves: 'id, updatedAt',
      rooms: 'id, moveId, updatedAt, name',
      boxes: 'id, moveId, roomId, updatedAt, number',
      items: 'id, moveId, boxId, updatedAt, name',
    });

    // v2 — add images table; adding a table is a non-breaking change
    this.version(2).stores({
      moves: 'id, updatedAt',
      rooms: 'id, moveId, updatedAt, name',
      boxes: 'id, moveId, roomId, updatedAt, number',
      items: 'id, moveId, boxId, updatedAt, name',
      images: 'id, parentType, parentId, createdAt',
    });
  }
}

export const db = new AppDB();
