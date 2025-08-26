import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { createBox, listBoxes, listRooms, updateBoxStatus, useUI } from '@/store';
import type { BoxStatus } from '@/types';

const STATUS: BoxStatus[] = ['open', 'packed', 'sealed', 'unpacked'];
type SortKey = 'number-asc' | 'number-desc' | 'created-desc' | 'updated-desc';

export default function Boxes() {
  const { moveId } = useParams();
  const { setCurrentMove } = useUI();
  const [params, setParams] = useSearchParams();

  const [boxes, setBoxes] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomId, setRoomId] = useState<string>(params.get('roomId') ?? 'ALL');
  const [sel, setSel] = useState<Record<BoxStatus, boolean>>({
    open: true,
    packed: true,
    sealed: true,
    unpacked: true,
  });
  const [sort, setSort] = useState<SortKey>('number-asc');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (moveId) setCurrentMove(moveId);
  }, [moveId]);

  useEffect(() => {
    (async () => {
      if (!moveId) return;
      const [bx, rm] = await Promise.all([listBoxes(moveId), listRooms(moveId)]);
      setBoxes(bx);
      setRooms(rm);
    })();
  }, [moveId]);

  // keep URL in sync with chosen room
  useEffect(() => {
    const p = new URLSearchParams(params);
    if (roomId === 'ALL') p.delete('roomId');
    else p.set('roomId', roomId);
    setParams(p, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const visible = useMemo(() => {
    let list = boxes;
    if (roomId !== 'ALL') list = list.filter((b) => b.roomId === roomId);
    list = list.filter((b) => sel[b.status]);
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'number-asc':
          return a.number.localeCompare(b.number, undefined, { numeric: true });
        case 'number-desc':
          return b.number.localeCompare(a.number, undefined, { numeric: true });
        case 'created-desc':
          return b.createdAt - a.createdAt;
        case 'updated-desc':
          return b.updatedAt - a.updatedAt;
      }
    });
  }, [boxes, roomId, sel, sort]);

  async function handleAddBox() {
    if (!moveId || roomId === 'ALL') return;
    setAdding(true);
    const res = await createBox(moveId, roomId);
    setAdding(false);
    if ((res as any)?.error === 'DUPLICATE_NUMBER') {
      alert('Box number conflict');
      return;
    }
    // refresh list
    const bx = await listBoxes(moveId);
    setBoxes(bx);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="h1">Boxes</h1>
        <button
          className="btn btn-primary"
          onClick={handleAddBox}
          disabled={roomId === 'ALL' || adding}
          title={roomId === 'ALL' ? 'Choose a room to add a box' : 'Add a new box in this room'}
        >
          {adding ? 'Adding…' : 'Add Box'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="mr-2">Room:</label>
          <select className="select" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="ALL">All Rooms</option>
            {rooms.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="mr-2">Filter:</span>
          {STATUS.map((s) => (
            <label key={s} className="mr-3 inline-flex items-center gap-1">
              <input
                type="checkbox"
                checked={!!sel[s]}
                onChange={(e) => setSel((v) => ({ ...v, [s]: e.target.checked }))}
              />{' '}
              {s}
            </label>
          ))}
        </div>

        <div>
          <label className="mr-2">Sort:</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="select"
          >
            <option value="number-asc">Number ↑</option>
            <option value="number-desc">Number ↓</option>
            <option value="created-desc">Most Recent (created)</option>
            <option value="updated-desc">Most Recent (updated)</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.length === 0 ? (
          <div className="text-neutral-500">
            {roomId === 'ALL'
              ? 'Choose a room to view or add boxes.'
              : 'No boxes found in this room yet.'}
          </div>
        ) : (
          visible.map((b) => (
            <div key={b.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  <span className="text-neutral-500 mr-1">#{b.number}</span>
                  Box
                </div>
                <select
                  className="select"
                  value={b.status}
                  onChange={async (e) => {
                    await updateBoxStatus(b.id, e.target.value as BoxStatus);
                    const bx = await listBoxes(moveId!);
                    setBoxes(bx);
                  }}
                >
                  {STATUS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-2 flex justify-between">
                <Link className="btn btn-ghost" to={`/moves/${b.moveId}/boxes/${b.id}`}>
                  Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
