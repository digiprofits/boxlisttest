import { useEffect, useState } from 'react';
import { exportJSON, importJSON, listBoxes, listItemsInBox, listMoves } from '@/store';
import { itemsToCSV } from '@/utils/csv';
import { download } from '@/utils/download';

export default function Settings(){
  const [moves, setMoves] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);

  useEffect(()=>{
    async function go(){
      const mv = await listMoves();
      setMoves(mv);
      // For CSV, flatten all boxes/items across all moves
      const allBoxes = [];
      const allItems = [];
      for (const m of mv) {
        const bx = await listBoxes(m.id);
        allBoxes.push(...bx);
        for (const b of bx) {
          const it = await listItemsInBox(b.id);
          allItems.push(...it);
        }
      }
      setBoxes(allBoxes);
      setItems(allItems);
    }
    go();
  }, []);

  async function doExportJSON(){
    const data = await exportJSON();
    download('box-it-up-backup.json', JSON.stringify(data, null, 2));
  }

  function handleImportJSON(e: React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(String(reader.result));
        await importJSON(data);
        alert('Import complete. Reload to see changes.');
      } catch (e) {
        alert('Import failed: ' + (e as Error).message);
      }
    };
    reader.readAsText(file);
  }

  function doExportCSV(){
    const csv = itemsToCSV(moves, boxes, items);
    download('box-it-up-inventory.csv', csv, 'text/csv');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings & Data</h1>
      <div className="card p-4 space-y-3">
        <div className="font-medium">Data Export / Import</div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={doExportJSON}>Export JSON (Full Backup)</button>
          <label className="btn btn-ghost cursor-pointer">Import JSON<input type="file" className="hidden" accept="application/json" onChange={handleImportJSON} /></label>
          <button className="btn btn-ghost" onClick={doExportCSV}>Export CSV (Inventory)</button>
        </div>
        <p className="text-sm text-neutral-600">JSON includes all moves, boxes, and items. CSV is a flat inventory list.</p>
      </div>
    </div>
  );
}