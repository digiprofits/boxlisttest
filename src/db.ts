import Dexie, { Table } from 'dexie';
import type { MoveRecord, BoxRecord, ItemRecord } from './types';

export class BoxDB extends Dexie {
  moves!: Table<MoveRecord, string>;
  boxes!: Table<BoxRecord, string>;
  items!: Table<ItemRecord, string>;

  constructor() {
    super('boxitup_v2');
    this.version(1).stores({
      moves: 'id, name, updatedAt',
      boxes: 'id, moveId, name, room, status, updatedAt',
      items: 'id, moveId, boxId, name, category, updatedAt'
    });
  }
}

export const db = new BoxDB();