import { useEffect, useState } from 'react';
import { exportJSON, importJSON, listBoxes, listItemsInBox, listMoves } from '@/store';
import { itemsToCSV } from '@/utils/csv';
import { download } from '@/utils/download';
import { useParams, useNavigate } from 'react-router-dom';

export default function Settings(){
  const [moves,setMoves]=useState<any[]>([]);
  const [boxes,setBoxes]=useState<any[]>([]);
  const [items,setItems]=useState<any[]>([]);
  const { moveId } = useParams();
  const nav = useNavigate();

  useEffect(()=>{ (async()=>{
    const mv=await listMoves(); setMoves(mv);
    const allBoxes:any[]=[]; const allItems:any[]=[];
    for(const m of mv){
      const bx=await listBoxes(m.id);
      allBoxes.push(...bx);
      for(const b of bx){ const it=await listItemsInBox(b.id); allItems.push(...it); }
    }
    setBoxes(allBoxes); setItems(allItems);
  })(); },[]);

  async function doExportJSON(){
    const data=await exportJSON();
    download('boxlist-backup.json', JSON.stringify(data,null,2));
  }

  function handleImportJSON(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=async()=>{ try{
      await importJSON(JSON.parse(String(reader.result)));
      alert('Import complete. Reload to see changes.');
    }catch(e){ alert('Import failed: '+(e as Error).message); } };
    reader.readAsText(file);
  }

  function doExportCSV(){
    const csv=itemsToCSV(moves,boxes,items);
    download('boxlist-inventory.csv', csv, 'text/csv');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings & Data</h1>

      <div className="card p-4 space-y-3">
        <div className="font-medium">Data Export / Import</div>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={doExportJSON}>Export JSON (Full Backup)</button>
          <label className="btn btn-ghost cursor-pointer">
            Import JSON
            <input type="file" className="hidden" accept="application/json" onChange={handleImportJSON}/>
          </label>
          <button className="btn btn-ghost" onClick={doExportCSV}>Export CSV (Inventory)</button>
          <button className="btn btn-ghost" onClick={()=>nav(`/moves/${moveId}/labels`)}>Open Printable Labels</button>
        </div>
        <p className="text-sm text-neutral-600">JSON includes all moves, boxes, and items. CSV is a flat inventory list.</p>
      </div>
    </div>
  );
}
