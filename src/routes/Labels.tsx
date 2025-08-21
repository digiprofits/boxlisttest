import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listBoxes, listMoves } from '@/store';
import { makeQRDataURL } from '@/utils/qrcode';

export default function Labels(){
  const { moveId } = useParams();
  const [moveName,setMoveName]=useState('');
  const [boxes,setBoxes]=useState<any[]>([]);
  const [qrMap,setQrMap]=useState<Record<string,string>>({});

  useEffect(()=>{ (async()=>{
    const moves=await listMoves();
    setMoveName(moves.find(m=>m.id===moveId)?.name || '');
    const bx=await listBoxes(moveId!);
    setBoxes(bx);
    const entries:Record<string,string> = {};
    for(const b of bx){
      const data = await makeQRDataURL(`boxlist://move/${moveId}/box/${b.id}`);
      entries[b.id] = data;
    }
    setQrMap(entries);
  })(); },[moveId]);

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <h1 className="text-2xl font-bold">Printable Labels</h1>
        <button className="btn btn-primary" onClick={()=>window.print()}>Print</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {boxes.map(b=>(
          <div key={b.id} className="label-card card p-4">
            <div className="text-sm text-neutral-500">{moveName}</div>
            <div className="text-xl font-bold">{b.name}</div>
            <div className="mt-2 flex items-center gap-3">
              {qrMap[b.id]
                ? <img src={qrMap[b.id]} alt="QR" className="h-24 w-24"/>
                : <div className="h-24 w-24 bg-neutral-200 rounded"/>}
              <div>
                <div className="badge border-neutral-300">Status: {b.status}</div>
                <div className="text-xs text-neutral-500 mt-1">ID: {b.id}</div>
              </div>
            </div>
          </div>
        ))}
        {boxes.length===0 && <div className="text-neutral-500">No boxes to print.</div>}
      </div>
    </div>
  );
}
