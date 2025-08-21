export type BoxStatus = 'open' | 'packed' | 'sealed' | 'unpacked';

export interface MoveRecord {
  id: string;
  name: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BoxRecord {
  id: string;
  moveId: string;
  name: string;
  room?: string;
  status: BoxStatus;
  notes?: string;
  images?: string[]; // data URLs for simplicity
  createdAt: number;
  updatedAt: number;
}

export interface ItemRecord {
  id: string;
  moveId: string;
  boxId: string;
  name: string;
  quantity: number;
  category?: string;
  fragile?: boolean;
  notes?: string;
  images?: string[]; // optional item-level images
  createdAt: number;
  updatedAt: number;
}