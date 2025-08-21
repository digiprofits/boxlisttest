import { useEffect, useMemo, useState } from 'react';
import { listAllItemsInMove, listBoxes, updateItem, deleteItem, moveItemToBox, useUI } from '@/store';
import { useParams, Link } from 'react-router-dom';
import Toasts, { useToasts } from '@/components/Toasts';

type EditDraft = { id:string; name:string; notes:string; boxId:string };

function shortWhen(ts:number){
  return new Date(ts).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

export default function Items(){
  const { moveId } = useParams();
  const { setCurrentMove } = useUI();
  const [items, setItems] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<EditDraft|null>(null);
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

  function startEdit(it:any){
    setEditing({ id: it.id, name: it.name, notes: it.notes || '', boxId: it.boxId });
  }
  function cancelEdit(){ setEditing(null); }

  async function saveEdit(){
    if(!editing) return;
    await updateItem(editing.id, { name: editing.name.trim(), notes: editing.notes.trim() });
    await moveItemToBox(editing.id, editing.boxId);
    push('Item updated');
    setEditing(null);
    refresh();
  }

  async function removeItem(id:string){
    if(confirm('Delete item?')){
      await deleteItem(id);
      push('Item deleted');
      refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Items</h1>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search items..." className="input input-sm w-72" />
      </div>

      {/* Compact list just like Boxes */}
      <div className="card p-0 overflow-hidden">
        {filtered.map((it, idx)=>(
          <div key={it.id} className={`px-3 sm:px-4 py-3 ${idx!==filtered.length-1?'border-b':''}`}>
            {/* Row */}
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{it.name}</div>
                <div className="text-sm text-neutral-600 truncate">
                  Box: <Link to={`/moves/${moveId}/boxes/${it.boxId}`} className="text-brand underline">{boxName(it.boxId)}</Link>
                </div>
              </div>

              <span className="badge badge-sm border-neutral-300 shrink-0">{shortWhen(it.updatedAt)}</span>

              {/* Actions: edit + delete (icon buttons like Boxes) */}
              <button
                className="btn-icon btn-ghost"
                title="Edit item"
                aria-label="Edit item"
                onClick={()=>startEdit(it)}
              >
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                </svg>
              </button>
              <button
                className="btn-icon btn-danger"
                title="Delete item"
                aria-label="Delete item"
                onClick={()=>removeItem(it.id)}
              >
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>

            {/* Inline editor (shown only when Edit is clicked) */}
            {editing?.id === it.id && (
              <div className="mt-3 rounded-xl border p-3 bg-neutral-50">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-neutral-600">Name</span>
                    <input
                      className="input input-sm mt-1"
                      value={editing.name}
                      onChange={e=>setEditing({...editing, name: e.target.value})}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-neutral-600">Box</span>
                    <select
                      className="input input-sm mt-1"
                      value={editing.boxId}
                      onChange={e=>setEditing({...editing, boxId: e.target.value})}
                    >
                      {boxes.map((b:any)=> <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="text-neutral-600">Notes</span>
                    <input
                      className="input input-sm mt-1"
                      value={editing.notes}
                      onChange={e=>setEditing({...editing, notes: e.target.value})}
                      placeholder="Notes (optional)"
                    />
                  </label>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={saveEdit}>Save</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>removeItem(it.id)}>Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length===0 && <div className="p-6 text-center text-neutral-500">No items match your search.</div>}
      </div>

      <Toasts toasts={toasts} />
    </div>
  );
}
