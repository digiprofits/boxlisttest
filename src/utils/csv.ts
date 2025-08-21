import type { BoxRecord, ItemRecord, MoveRecord } from '@/types';

export function itemsToCSV(moves: MoveRecord[], boxes: BoxRecord[], items: ItemRecord[]): string {
  const moveMap = new Map(moves.map(m => [m.id, m.name]));
  const boxMap = new Map(boxes.map(b => [b.id, b]));
  const rows = [
    ['Move','Box','Room','Status','Item','Qty','Category','Fragile','Notes']
  ];
  for (const it of items) {
    const box = boxMap.get(it.boxId);
    if (!box) continue;
    rows.push([
      moveMap.get(it.moveId) || '',
      box.name,
      box.room || '',
      box.status,
      it.name,
      String(it.quantity ?? 1),
      it.category || '',
      it.fragile ? 'Yes' : 'No',
      (it.notes || '').replace(/(\r|\n)+/g, ' ').trim()
    ]);
  }
  return rows.map(r => r.map(field => {
    if (/[",\n]/.test(field)) return '"' + field.replace(/"/g, '""') + '"';
    return field;
  }).join(',')).join('\n');
}