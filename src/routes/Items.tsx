import { useEffect, useMemo, useState } from 'react';
import { listAllItemsInMove, listBoxes, updateItem, deleteItem, moveItemToBox, useUI } from '@/store';
import { useParams, Link } from 'react-router-dom';
import InlineEditable from '@/components/InlineEditable';
import Toasts, { useToasts } from '@/components/Toasts';

export default function Items(){
  const { moveId } = useParams();
  const { setCurrentMove } = useUI();
  const [items, setItems] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const { toasts, push } = useToasts();

  useEffect(()=>{ if(moveId) setCurrentMove(moveId); }, [moveId]);

  async function refresh(){
    const [it, bx] = await Promise.all([listAllItemsInMove(moveId!), listBoxes(moveId!)]);
    setItems(it); setBoxes(bx);
  }
  useEffect(()=>{ refresh(); }, [moveId]);

  const boxName = useMemo(()=>{
    const m = new Map(boxes.map((b:any)=>[b.id,b.name]));
    return (id:string)=> m.get(id) || '';
  }, [boxes]);

  const filtered = items.filter(it => {
    const hay = (it.name + ' ' + (it.notes||'') + ' ' + boxName(it.boxId)).toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Items</h1>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search items..." className="input input-sm w-72" />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_160px] gap-3 px-4 py-2 text-sm text-neutral-600 border-b">
          <div>Item</div><div>Box</div><div>Updated</div><div>Actions</div>
        </div>
        {filtered.map(it => (
          <div key={it.id} className="grid grid-cols-[2fr_1fr_1fr_160px] gap-3 px-4 py-3 border-b items-center">
            <InlineEditable value={it.name} onSave={v=>updateItem(it.id, { name: v })} className="font-medium" />
            <Link to={`/moves/${moveId}/boxes/${it.boxId}`} className="text-brand hover:underline">{boxName(it.boxId)}</Link>
            <div className="text-sm text-neutral-500">{new Date(it.updatedAt).toLocaleString()}</div>
            <div className="flex gap-2 items-center">
              <button className="btn btn-ghost btn-sm">Edit</button>
              <select className="input input-sm" value={it.boxId} onChange={e=>{ moveItemToBox(it.id, e.target.value); setTimeout(refresh, 50); }}>
                {boxes.map((b:any)=> <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <button className="btn btn-danger btn-sm" onClick={async ()=>{ if(confirm('Delete item?')){ await deleteItem(it.id); push('Item deleted'); refresh(); } }}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-6 text-center text-neutral-500">No items match your search.</div>
        )}
      </div>

      <Toasts toasts={toasts} />
    </div>
  );
}
