import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createMove, deleteMove, listMoves, updateMove, useUI } from '@/store';
import InlineEditable from '@/components/InlineEditable';

type Move = {
  id: string;
  name: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
};

export default function Moves() {
  const nav = useNavigate();
  const { setCurrentMove } = useUI();
  const [moves, setMoves] = useState<Move[]>([]);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => setMoves(await listMoves()))();
  }, []);

  async function addMove() {
    const name = (nameRef.current?.value || '').trim();
    if (!name) return;
    const m = await createMove(name);
    nameRef.current!.value = '';
    setMoves(await listMoves());
    setCurrentMove(m.id);
    nav(`/moves/${m.id}/rooms`);
  }

  async function renameMove(id: string, name: string) {
    await updateMove(id, { name });
    setMoves(await listMoves());
  }

  async function removeMove(id: string) {
    if (!confirm('Delete this move? Rooms, boxes and items will also be removed.')) return;
    await deleteMove(id);
    setMoves(await listMoves());
  }

  if (moves.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="h1">Welcome to BoxLister</h1>
        <div className="card p-6">
          <ol className="list-decimal pl-5 space-y-3">
            <li>Click <span className="font-semibold">New Move</span></li>
            <li>Add <span className="font-semibold">Rooms</span> (Kitchen, Bedroom…)</li>
            <li>Add <span className="font-semibold">Boxes</span> to rooms</li>
            <li>Add <span className="font-semibold">Items</span> (press <em>Enter</em> to add quickly)</li>
            <li>Print labels with QR codes</li>
          </ol>
          <div className="mt-6 space-y-2">
            <input
              ref={nameRef}
              className="input w-full"
              placeholder="Move name (e.g., Sydney Move, Office Relocation, Storage 2025)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addMove();
                }
              }}
            />
            <button className="btn btn-primary" onClick={addMove}>New Move</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">Your Moves</h1>
        <div className="flex gap-2">
          <input
            ref={nameRef}
            className="input"
            placeholder="New Move name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addMove();
              }
            }}
          />
          <button className="btn btn-primary" onClick={addMove}>New Move</button>
        </div>
      </div>

      <div className="space-y-3">
        {moves.map((m) => (
          <div key={m.id} className="card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <InlineEditable value={m.name} onSave={(v) => renameMove(m.id, v)} />
                <div className="text-sm text-neutral-600">Last edited {new Date(m.updatedAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <Link className="btn btn-ghost" to={`/moves/${m.id}/rooms`}>Open</Link>
                <button className="btn btn-ghost text-red-600" onClick={() => removeMove(m.id)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
