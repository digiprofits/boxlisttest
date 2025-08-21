import { useRef, useState } from 'react';
import Modal from './Modal';

export default function ImagePicker({
  onSave,
  variant = 'text',
  label = 'Add Images'
}:{ onSave:(dataURL:string)=>void; variant?: 'text'|'icon'; label?: string }){
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string|null>(null);

  function trigger(){ inputRef.current?.click(); }
  function onChange(e: React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
    e.currentTarget.value = '';
  }

  return (
    <>
      {variant === 'icon' ? (
        <button type="button" aria-label={label} className="btn-icon btn-ghost" onClick={trigger} title={label}>
          <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h3l2-3h6l2 3h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/>
            <circle cx="12" cy="13" r="3"/>
          </svg>
        </button>
      ) : (
        <button type="button" className="btn btn-ghost btn-sm" onClick={trigger}>{label}</button>
      )}

      <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onChange}/>
      <Modal open={!!preview} onClose={()=>setPreview(null)} title="Add Image">
        {preview && (
          <>
            <img src={preview} alt="Preview" className="max-h-[50vh] w-full object-contain rounded-xl border" />
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={()=>setPreview(null)}>Retake</button>
              <button className="btn btn-primary" onClick={()=>{ onSave(preview); setPreview(null); }}>Save Image</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
