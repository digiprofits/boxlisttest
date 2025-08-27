export type BoxStatus = 'open' | 'packed' | 'sealed' | 'unpacked';

export type MoveRecord = {
  id: string;
  name: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export type RoomRecord = {
  id: string;
  moveId: string;
  name: string;
  sortOrder?: number;
  createdAt: number;
  updatedAt: number;
};

export type BoxRecord = {
  id: string;
  moveId: string;
  roomId: string;
  number: string;        // display number e.g. "01"
  name?: string;         // generally unused (we show number), kept for compatibility
  status: BoxStatus;
  notes?: string;        // NEW
  createdAt: number;
  updatedAt: number;
};

export type ItemRecord = {
  id: string;
  moveId: string;
  boxId: string;
  name: string;
  notes?: string;        // NEW
  createdAt: number;
  updatedAt: number;
};

/** Image stored as a Data URL (base64). We keep images separate for many-to-one. */
export type ImageRecord = {
  id: string;
  parentType: 'box' | 'item';
  parentId: string;
  dataUrl: string;       // image/* data URL
  createdAt: number;
};
