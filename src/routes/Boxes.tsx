import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createBox, listBoxes, listItemsInBox, updateBox, deleteBox, useUI } from '@/store';
import InlineEditable from '@/components/InlineEditable';
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
        <h1 className="text-2xl font-bold">Boxes</h1>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={()=> nav(`/moves/${moveId}/labels`)}>Print Labels</button>
          <button className="btn btn-ghost" onClick={()=> nav(`/moves/${moveId}/settings`)}>Settings</button>
        </div>
      </div>

      <form onSubmit={quickAdd} className="card p-4 flex flex-col sm:flex-row gap-3">
        <input ref={nameRef} className="input" placeholder="Box name (e.g., Kitchen #1)" autoFocus />
        <button className="btn btn-primary" type="submit">Add Box (Enter)</button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {boxes.map(b => (
          <div key={b.id} className="card p-4 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <InlineEditable value={b.name} onSave={v=>updateBox(b.id, { name: v })} className="text-lg font-semibold" />
              <span className="badge border-neutral-300">Items: {stats[b.id] ?? 0}</span>
            </div>
            <div className="mt-2">
              <StatusSelect value={b.status} onChange={(v)=>updateBox(b.id, { status: v })} />
            </div>
            {b.images?.length ? (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {b.images.slice(0,3).map((src:string, i:number)=> (
                  <img key={i} src={src} alt="" className="h-20 w-full object-cover rounded-xl border" />
                ))}
              </div>
            ) : (
              <div className="mt-3 text-sm text-neutral-500">No images yet.</div>
            )}
            <div className="mt-3 flex gap-2">
              <button className="btn btn-ghost" onClick={()=> nav(`/moves/${moveId}/boxes/${b.id}`)}>Add / View Items</button>
              <ImagePicker onSave={async (url)=>{ const imgs = [...(b.images||[]), url]; await updateBox(b.id, { images: imgs }); push('Image saved'); refresh(); }} />
              <button className="btn btn-danger ml-auto" onClick={async ()=>{ if(confirm('Delete this box and its items?')){ await deleteBox(b.id); push('Box deleted'); refresh(); } }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Toasts toasts={toasts} />
    </div>
  );
}
