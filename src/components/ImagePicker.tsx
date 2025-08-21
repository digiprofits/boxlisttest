import { useRef, useState } from 'react';
import Modal from './Modal';

export default function ImagePicker({ onSave }:{ onSave:(dataURL:string)=>void }){
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
      <button type="button" className="btn btn-ghost btn-sm" onClick={trigger}>Add Images</button>
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
