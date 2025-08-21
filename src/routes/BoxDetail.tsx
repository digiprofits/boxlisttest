import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createItem, listBoxes, listItemsInBox, moveItemToBox, updateBox, updateItem, deleteItem, useUI } from '@/store';
import InlineEditable from '@/components/InlineEditable';
import StatusSelect from '@/components/StatusSelect';
import ImagePicker from '@/components/ImagePicker';
import Toasts, { useToasts } from '@/components/Toasts';

export default function BoxDetail(){
  const { moveId, boxId } = useParams();
  const nav = useNavigate();
  const { setCurrentMove } = useUI();
  const [box, setBox] = useState<any>(null);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const nameRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const catRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLInputElement>(null);
  const { toasts, push } = useToasts();

  useEffect(()=>{ if(moveId) setCurrentMove(moveId); }, [moveId]);

  async function refresh(){
    // load box
    const bx = await listBoxes(moveId!);
    setBoxes(bx);
    const b = bx.find(x => x.id === boxId);
    setBox(b);
    // items
    setItems(await listItemsInBox(boxId!));
  }
  useEffect(()=>{ refresh(); }, [moveId, boxId]);

  async function addItem(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const name = nameRef.current!.value.trim();
    if(!name) return;
    const qty = parseInt(qtyRef.current!.value || '1', 10) || 1;
    const category = catRef.current!.value.trim();
    const notes = notesRef.current!.value.trim();
    await createItem(moveId!, boxId!, { name, quantity: qty, category, notes });
    push('Item added');
    nameRef.current!.value = '';
    qtyRef.current!.value = '1';
    catRef.current!.value = '';
    notesRef.current!.value = '';
    nameRef.current!.focus();
    refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/moves/${moveId}/boxes`} className="btn btn-ghost">← Back</Link>
          <h1 className="text-2xl font-bold">Box</h1>
        </div>
      </div>

      {box && (
        <div className="card p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <InlineEditable value={box.name} onSave={v=>updateBox(box.id, { name: v })} className="text-xl font-semibold" />
            <span className="text-neutral-500">Room:</span>
            <InlineEditable value={box.room || ''} onSave={v=>updateBox(box.id, { room: v })} placeholder="(none)" />
          </div>
          <StatusSelect value={box.status} onChange={(v)=>updateBox(box.id, { status: v })} />

          <div className="mt-2">
            <div className="font-medium mb-2">Box Images</div>
            {box.images?.length ? (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {box.images.map((src:string, i:number)=> (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="h-24 w-full object-cover rounded-xl border" />
                    <button className="absolute top-1 right-1 bg-white/90 rounded-lg px-2 py-1 text-xs"
                      onClick={async ()=>{ const imgs = box.images.filter((_:any, idx:number)=> idx!==i); await updateBox(box.id, { images: imgs }); push('Image removed'); refresh(); }}>✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-neutral-500">No images yet.</div>
            )}
            <div className="mt-2">
              <ImagePicker multiple onPick={async (urls)=>{ const imgs = [...(box.images||[]), ...urls]; await updateBox(box.id, { images: imgs }); push('Images added'); refresh(); }} />
            </div>
          </div>
        </div>
      )}

      <div className="card p-4">
        <form onSubmit={addItem} className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm text-neutral-600">Item name</label>
            <input ref={nameRef} className="input" placeholder="e.g., Plates" autoFocus />
          </div>
          <div className="w-28">
            <label className="text-sm text-neutral-600">Qty</label>
            <input ref={qtyRef} className="input" defaultValue="1" type="number" min="1" />
          </div>
          <div className="w-48">
            <label className="text-sm text-neutral-600">Category (optional)</label>
            <input ref={catRef} className="input" placeholder="Kitchenware" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm text-neutral-600">Notes (optional)</label>
            <input ref={notesRef} className="input" placeholder="Glass / fragile" />
          </div>
          <button className="btn btn-primary">Add Item (Enter)</button>
        </form>

        <div className="mt-4 divide-y">
          {items.map(it => (
            <div key={it.id} className="py-3 flex items-center gap-3">
              <InlineEditable value={it.name} onSave={v=>updateItem(it.id, { name: v })} className="flex-1 font-medium" />
              <input className="input w-20" type="number" min="1" value={it.quantity}
                onChange={e=>updateItem(it.id, { quantity: parseInt(e.target.value||'1',10)||1 })} />
              <InlineEditable value={it.category || ''} onSave={v=>updateItem(it.id, { category: v })} placeholder="Category" className="w-40" />
              <InlineEditable value={it.notes || ''} onSave={v=>updateItem(it.id, { notes: v })} placeholder="Notes" className="flex-1" />
              <select className="input w-40" value={it.boxId} onChange={e=>{ moveItemToBox(it.id, e.target.value); setTimeout(refresh, 50); }}>
                {boxes.map((b:any)=> <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <button className="btn btn-danger" onClick={async ()=>{ if(confirm('Delete item?')){ await deleteItem(it.id); push('Item deleted'); refresh(); } }}>Delete</button>
            </div>
          ))}
          {items.length === 0 && (
            <div className="py-8 text-center text-neutral-500">No items yet. Add your first item above.</div>
          )}
        </div>
      </div>

      <Toasts toasts={toasts} />
    </div>
  );
}