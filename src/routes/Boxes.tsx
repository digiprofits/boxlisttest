import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createBox, listBoxes, listItemsInBox, updateBox, deleteBox, useUI } from '@/store';
import StatusSelect from '@/components/StatusSelect';
import ImagePicker from '@/components/ImagePicker';
import Toasts, { useToasts } from '@/components/Toasts';

export default function Boxes(){
  const { moveId } = useParams();
  const nav = useNavigate();
  const { setCurrentMove } = useUI();
  const [boxes, setBoxes] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const { toasts, push } = useToasts();

  useEffect(()=>{ if(moveId) setCurrentMove(moveId); }, [moveId]);

  async function refresh(){
    if(!moveId) return;
    const bx = await listBoxes(moveId);
    setBoxes(bx);
    const counts: Record<string, number> = {};
    await Promise.all(bx.map(async b => { counts[b.id] = (await listItemsInBox(b.id)).length; }));
    setStats(counts);
  }
  useEffect(()=>{ refresh(); }, [moveId]);

  async function quickAdd(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    if(!moveId) return;
    const name = nameRef.current!.value.trim();
    if(!name) return;
    const newBox = await createBox(moveId, { name, status: 'open' });
    nameRef.current!.value = '';
    push('Box added');
    nav(`/moves/${moveId}/boxes/${newBox.id}`); // auto-open new box
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Boxes</h1>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={()=> nav(`/moves/${moveId}/labels`)}>Print Labels</button>
          <button className="btn btn-ghost btn-sm" onClick={()=> nav(`/moves/${moveId}/settings`)}>Settings</button>
        </div>
      </div>

      <form onSubmit={quickAdd} className="card p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
        <input ref={nameRef} className="input input-sm" placeholder="Box name (e.g., Kitchen #1)" />
        <button className="btn btn-primary btn-sm" type="submit">Add Box (Enter)</button>
      </form>

      {/* Compact list */}
      <div className="card p-0 overflow-hidden">
        {boxes.map((b, idx)=>(
          <div key={b.id} className={`px-3 sm:px-4 py-3 flex items-center gap-3 ${idx!==boxes.length-1?'border-b':''}`}>
            {/* Left: box name & count */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Link to={`/moves/${moveId}/boxes/${b.id}`} className="font-semibold truncate hover:underline">
                  {b.name}
                </Link>
                <span className="badge badge-sm border-neutral-300 shrink-0">Items: {stats[b.id] ?? 0}</span>
              </div>
            </div>

            {/* Middle: compact status */}
            <div className="hidden sm:block w-40 shrink-0">
              <StatusSelect compact value={b.status} onChange={(v)=>updateBox(b.id,{ status: v })} />
            </div>

            {/* Right: tiny actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Add/View Items (open box) */}
              <button
                className="btn-icon btn-ghost"
                title="Open / Add Items"
                aria-label="Open / Add Items"
                onClick={()=> nav(`/moves/${moveId}/boxes/${b.id}`)}
              >
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M3 12h18M3 18h18"/>
                </svg>
              </button>

              {/* Add image */}
              <ImagePicker
                variant="icon"
                label="Add Image"
                onSave={async (url)=>{ const imgs=[...(b.images||[]), url]; await updateBox(b.id,{ images: imgs }); push('Image saved'); refresh(); }}
              />

              {/* Delete */}
              <button
                className="btn-icon btn-danger"
                title="Delete Box"
                aria-label="Delete Box"
                onClick={async ()=>{ if(confirm('Delete this box and its items?')){ await deleteBox(b.id); push('Box deleted'); refresh(); } }}
              >
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>
        ))}
        {boxes.length===0 && <div className="p-6 text-center text-neutral-500">No boxes yet. Add one above.</div>}
      </div>

      <Toasts toasts={toasts} />
    </div>
  );
}
