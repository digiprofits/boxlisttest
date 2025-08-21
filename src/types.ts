export type BoxStatus = 'open' | 'packed' | 'sealed' | 'unpacked';

export interface MoveRecord {
  id: string; name: string; notes?: string; createdAt: number; updatedAt: number;
}

export interface BoxRecord {
  id: string; moveId: string; name: string; status: BoxStatus;
  notes?: string; images?: string[]; createdAt: number; updatedAt: number;
}

export interface ItemRecord {
  id: string; moveId: string; boxId: string; name: string;
  notes?: string; order: number; createdAt: number; updatedAt: number;
}
