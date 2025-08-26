export type BoxStatus = 'open' | 'packed' | 'sealed' | 'unpacked';


export interface MoveRecord {
id: string;
name: string;
notes?: string;
createdAt: number;
updatedAt: number;
}


export interface RoomRecord {
id: string;
moveId: string;
name: string;
sortOrder?: number;
createdAt: number;
updatedAt: number;
}


export interface BoxRecord {
id: string;
moveId: string; // denormalized for faster lookups
roomId: string; // FK → RoomRecord.id
number: string; // unique per Move (e.g., "01")
name: string; // user-defined label/name
status: BoxStatus; // 'open' | 'packed' | 'sealed' | 'unpacked'
notes?: string;
images?: string[];
createdAt: number;
updatedAt: number;
}


export interface ItemRecord {
id: string;
moveId: string; // denormalized for search/filters
boxId: string; // FK → BoxRecord.id
name: string;
notes?: string;
order?: number; // optional display order
createdAt: number;
updatedAt: number;
}
