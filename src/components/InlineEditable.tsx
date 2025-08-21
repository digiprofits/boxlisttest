import { useEffect, useRef, useState } from 'react';

export default function InlineEditable({ value, onSave, placeholder='Untitled', className='' }:{ value:string; onSave:(v:string)=>void; placeholder?:string; className?:string }){
  const [val, setVal] = useState(value);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{ setVal(value); }, [value]);
  useEffect(()=>{ if(editing) inputRef.current?.focus(); }, [editing]);

  function commit(){
    setEditing(false);
    if(val.trim() !== value.trim()) onSave(val.trim() || placeholder);
  }

  return editing ? (
    <input ref={inputRef} className={`input ${className}`} value={val} onChange={e=>setVal(e.target.value)}
      onBlur={commit} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); commit(); } if(e.key==='Escape'){ setEditing(false); setVal(value); } }} />
  ) : (
    <span className={`cursor-text ${className}`} onClick={()=>setEditing(true)}>{value || <span className="text-neutral-400">{placeholder}</span>}</span>
  );
}