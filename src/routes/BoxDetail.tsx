import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createItem, listBoxes, listItemsInBox, moveItemToBox, updateBox, updateItem, deleteItem, useUI, reorderItems } from '@/store';
import InlineEditable from '@/components/InlineEditable';
import StatusSelect from '@/components/StatusSelect';
import ImagePicker from '@/components/ImagePicker';
import Toasts, { useToasts } from '@/components/Toasts';

type EditDraft = { id:string; name:string; notes:string; boxId:string };

export default function BoxDetail(){
  const { moveId, boxId } = useParams();
  const nav = useNavigate();
  const { setCurrentMove } = useUI();

  const [box, setBox] = useState<any>(null);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);

  const nameRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLInputElement>(null);
  const { toasts, push } = useToasts();

  const [draggingId, setDraggingId] = useState<string|null>(null);
  const [editing, setEditing] = useState<EditDraft|null>(null);

  useEffect(()=>{ if(moveId) setCurrentMove(moveId); }, [moveId]);

  async function refresh(){
    const bx = await listBoxes(moveId!);
    setBoxes(bx);
    setBox(bx.find(x => x.id === boxId));
    setItems(await listItemsInBox(boxId!));
  }
  useEffect(()=>{ refresh(); }, [moveId, boxId]);

  async function addItem(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const name = nameRef.current!.value.trim();
    if(!name) return;
    const notes = notesRef.current!.value.trim();
    await createItem(moveId!, boxId!, { name, notes });
    push('Item added');
    nameRef.current!.value = '';
    notesRef.current!.value = '';
    refresh();
  }

  async function handleDrop(targetId: string){
    if(!draggingId || draggingId===targetId) return;
    const ids = items.map((it:any)=> it.id);
    const from = ids.indexOf(draggingId);
    const to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    await reorderItems(ids);
    setDraggingId(null);
    refresh();
  }

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={`/moves/${moveId}/boxes`} className="btn btn-ghost btn-sm">← Back</Link>
          <h1 className="text-xl sm:text-2xl font-bold">Box</h1>
        </div>
      </div>

      {box && (
        <div className="card p-3 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <InlineEditable value={box.name} onSave={v=>updateBox(box.id, { name: v })} className="text-xl font-semibold" />
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
              <ImagePicker onSave={async (url)=>{ const imgs = [...(box.images||[]), url]; await updateBox(box.id, { images: imgs }); push('Image saved'); refresh(); }} />
            </div>
          </div>
        </div>
      )}

      <div className="card p-3 sm:p-4">
        <form onSubmit={addItem} className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[220px]">
            <label className="text-sm text-neutral-600">Item name</label>
            <input ref={nameRef} className="input input-sm" placeholder="e.g., Plates" />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="text-sm text-neutral-600">Notes (optional)</label>
            <input ref={notesRef} className="input input-sm" placeholder="Glass / fragile" />
          </div>
          <button className="btn btn-primary btn-sm">Add Item (Enter)</button>
        </form>

        {/* Items list */}
        <div className="mt-4 divide-y">
          {items.map(it => (
            <div key={it.id} className="py-3">
              {/* Row */}
              <div
                className="flex items-center gap-3"
                draggable
                onDragStart={()=>setDraggingId(it.id)}
                onDragOver={(e)=>e.preventDefault()}
                onDrop={()=>handleDrop(it.id)}
              >
                <span className="cursor-grab select-none">☰</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{it.name}</div>
                  {it.notes && <div className="text-sm text-neutral-600 truncate">{it.notes}</div>}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={()=>startEdit(it)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={()=>removeItem(it.id)}>Delete</button>
              </div>

              {/* Inline editor */}
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
          {items.length === 0 && (
            <div className="py-8 text-center text-neutral-500">No items yet. Add your first item above.</div>
          )}
        </div>
      </div>

      <Toasts toasts={toasts} />
    </div>
  );
}
