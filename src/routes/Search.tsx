import { useEffect, useState } from 'react';
import { listBoxes, listAllItemsInMove, useUI } from '@/store';
import { useParams, Link } from 'react-router-dom';

export default function Search(){
  const { moveId } = useParams();
  const { setCurrentMove } = useUI();
  const [boxes, setBoxes] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState('');

  useEffect(()=>{ if(moveId) setCurrentMove(moveId); }, [moveId]);
  useEffect(()=>{ (async()=>{ const [bx, it] = await Promise.all([listBoxes(moveId!), listAllItemsInMove(moveId!)]); setBoxes(bx); setItems(it); })(); }, [moveId]);

  const b = boxes.filter(x => (x.name).toLowerCase().includes(q.toLowerCase()));
  const i = items.filter(x => (x.name + ' ' + (x.notes||'')).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Search</h1>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search boxes & items..." className="input w-80" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-3">Boxes</h2>
          <div className="space-y-2">
            {b.map(x => (
              <Link key={x.id} to={`/moves/${moveId}/boxes/${x.id}`} className="block p-2 rounded-lg hover:bg-neutral-50 border">{x.name}</Link>
            ))}
            {b.length === 0 && <div className="text-neutral-500">No boxes found.</div>}
          </div>
        </div>
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-3">Items</h2>
          <div className="space-y-2">
            {i.map(x => (
              <Link key={x.id} to={`/moves/${moveId}/boxes/${x.boxId}`} className="block p-2 rounded-lg hover:bg-neutral-50 border">
                <div className="font-medium">{x.name}</div>
                {x.notes && <div className="text-sm text-neutral-600">{x.notes}</div>}
              </Link>
            ))}
            {i.length === 0 && <div className="text-neutral-500">No items found.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
