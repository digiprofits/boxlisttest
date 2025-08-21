export default function ImagePicker({ onPick, multiple=false }:{ onPick:(dataURLs:string[])=>void; multiple?:boolean }){
  function handleChange(e: React.ChangeEvent<HTMLInputElement>){
    const files = Array.from(e.target.files || []);
    const readers = files.map(f => new Promise<string>((res, rej)=>{
      const r = new FileReader();
      r.onload = ()=> res(String(r.result));
      r.onerror = rej;
      r.readAsDataURL(f);
    }));
    Promise.all(readers).then(onPick);
  }
  return (
    <label className="btn btn-ghost cursor-pointer">
      Add Images
      <input type="file" accept="image/*" multiple={multiple} className="hidden" onChange={handleChange}/>
    </label>
  );
}