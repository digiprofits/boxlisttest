import type { BoxStatus } from '@/types';

const options: {value:BoxStatus; label:string}[] = [
  { value: 'open', label: 'Open' },
  { value: 'packed', label: 'Packed' },
  { value: 'sealed', label: 'Sealed' },
  { value: 'unpacked', label: 'Unpacked' },
];

export default function StatusSelect({ value, onChange }:{ value:BoxStatus; onChange:(v:BoxStatus)=>void }){
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o.value}
          type="button"
          onClick={()=>onChange(o.value)}
          className={`px-3 py-1 rounded-full border ${o.value===value ? 'bg-brand text-white border-brand' : 'bg-white hover:bg-neutral-100'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}