import type { BoxStatus } from '@/types';

const options:{value:BoxStatus;label:string}[]=[
  {value:'open',label:'Open'},
  {value:'packed',label:'Packed'},
  {value:'sealed',label:'Sealed'},
  {value:'unpacked',label:'Unpacked'},
];

export default function StatusSelect({
  value,
  onChange,
  compact = false
}:{ value:BoxStatus; onChange:(v:BoxStatus)=>void; compact?:boolean }){
  if (compact) {
    return (
      <select
        aria-label="Status"
        value={value}
        onChange={e=>onChange(e.target.value as BoxStatus)}
        className="input input-sm"
      >
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  return (
    <label className="block">
      <span className="text-sm text-neutral-600">Status</span>
      <select
        value={value}
        onChange={e=>onChange(e.target.value as BoxStatus)}
        className="input mt-1"
      >
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
