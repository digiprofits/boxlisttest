import { useEffect, useRef, useState } from 'react';
import { createMove, deleteMove, listMoves, updateMove, useUI } from '@/store';
import InlineEditable from '@/components/InlineEditable';
import Modal from '@/components/Modal';
import { useNavigate } from 'react-router-dom';
import Toasts, { useToasts } from '@/components/Toasts';

export default function Moves(){
  const [moves,setMoves]=useState<any[]>([]);
  const [open,setOpen]=useState(false);
  const nameRef=useRef<HTMLInputElement>(null);
  const nav=useNavigate();
  const { setCurrentMove } = useUI();
  const { toasts, push } = useToasts();

  async function refresh(){ setMoves(await listMoves()); }
  useEffect(()=>{ refresh(); },[]);

  async function makeMove(name:string){
    const m=await createMove(name);
    push('Move created');
    setCurrentMove(m.id);
    nav(`/moves/${m.id}/boxes`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Moves</h1>
          {moves.length===0 && (
            <div className="mt-2">
              <div className="text-xl font-semibold">Welcome to BoxList</div>
              <p className="text-neutral-600">
                Start by creating your first move. You can add boxes, items, images, and print labels with QR codes.
              </p>
            </div>
          )}
        </div>
        <button onClick={()=>setOpen(true)} className="btn btn-primary">New Move</button>
      </div>

      {moves.length===0 && (
        <div className="card p-6">
          <ol className="list-decimal pl-5 space-y-2">
            <li>Click <strong>New Move</strong></li>
            <li>Add boxes (set status, add images)</li>
            <li>Add items to each box (Enter adds quickly)</li>
            <li>Print labels with QR codes</li>
          </ol>
        </div>
      )}

      {moves.length>0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {moves.map(m=>(
            <div key={m.id} className="card p-4 flex flex-col">
              <InlineEditable value={m.name} onSave={v=>updateMove(m.id,{name:v})} className="text-lg font-semibold"/>
              <div className="mt-1 text-sm text-neutral-500">Last edited {new Date(m.updatedAt).toLocaleString()}</div>
              <div className="mt-4 flex gap-2">
                <button className="btn btn-primary" onClick={()=>{ setCurrentMove(m.id); nav(`/moves/${m.id}/boxes`); }}>Open</button>
                <button className="btn btn-ghost" onClick={async ()=>{ const name=prompt('Duplicate name', m.name+' (copy)'); if(name){ await makeMove(name); }}}>Duplicate</button>
                <button className="btn btn-danger ml-auto" onClick={async ()=>{ if(confirm('Delete this move and all its boxes/items?')){ await deleteMove(m.id); push('Move deleted'); refresh(); }}}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={()=>setOpen(false)} title="New Move">
        <form onSubmit={(e)=>{ e.preventDefault(); const v=nameRef.current!.value.trim(); if(v){ setOpen(false); makeMove(v); }}}>
          <input ref={nameRef} autoFocus placeholder="Move name (e.g., Brisbane to Sydney)" className="input"/>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={()=>setOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create & Open</button>
          </div>
        </form>
      </Modal>

      <Toasts toasts={toasts}/>
    </div>
  );
}
