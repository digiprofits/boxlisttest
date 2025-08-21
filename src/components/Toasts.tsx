import { useEffect, useState } from 'react';

export function useToasts(){
  const [toasts, setToasts] = useState<{id:number; text:string}[]>([]);
  function push(text:string){
    const id = Date.now()+Math.random();
    setToasts(t=>[...t,{id,text}]);
    setTimeout(()=> setToasts(t=>t.filter(x=>x.id!==id)), 3000);
  }
  return { toasts, push };
}

export default function Toasts({ toasts }:{ toasts:{id:number; text:string}[] }){
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 space-y-2 z-50">
      {toasts.map(t => (
        <div key={t.id} className="bg-black text-white/90 rounded-xl px-3 py-2 shadow-soft">{t.text}</div>
      ))}
    </div>
  );
}