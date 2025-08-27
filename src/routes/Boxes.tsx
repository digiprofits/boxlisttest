import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { createBox, listBoxes, listRooms, listAllItemsInMove, updateBoxStatus, deleteBox, useUI } from '@/store';
import type { BoxStatus } from '@/types';

const STATUS: BoxStatus[] = ['open', 'packed', 'sealed', 'unpacked'];
type SortKey = 'number-asc' | 'number-desc' | 'created-desc' | 'updated-desc';

type Room = { id: string; name: string };

export default function Boxes() {
  const { moveId } = useParams();
  const { setCurrentMove } = useUI();
  const [params, setParams] = useSearchParams();

  const [boxes, setBoxes] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<string>(params.get('roomId') ?? 'ALL');
  const [sel, setSel] = useState<Record<BoxStatus, boolean>>({
    open: true, packed: true, sealed: true, unpacked: true,
  });
  const [sort, setSort] = useState<SortKey>('number-asc');
  const [adding, setAdding] = useState(false);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({}); // boxId -> count

  useEffect(() => { if (moveId) setCurrentMove(moveId); }, [moveId]);

  async function loadAll() {
    if (!moveId) return;
    const [bx, rm, items] = await Promise.all([listBoxes(moveId), listRooms(moveId), listAllItemsInMove(moveId)]);
    setBoxes(bx);
    setRooms(rm as Room[]);
    const counts: Record<string, number> = {};
    for (const it of items) counts[it.boxId] = (counts[it.boxId] || 0) + 1;
    setItemCounts(counts);
  }

  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [moveId]);

  // keep URL in sync with chosen room
  useEffect(() => {
    const p = new URLSearchParams(params);
    if (roomId === 'ALL') p.delete('roomId'); else p.set('roomId', roomId);
    setParams(p, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const roomsMap = useMemo(() => Object.fromEntries(rooms.map(r => [r.id, r])), [rooms]);

  const visible = useMemo(() => {
    let list = boxes;
    if (roomId !== 'ALL') list = list.filter((b) => b.roomId === roomId);
    list = list.filter((b) => sel[b.status]);
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'number-asc': return a.number.localeCompare(b.number, undefined, { numeric: true });
        case 'number-desc': return b.number.localeCompare(a.number, undefined, { numeric: true });
        case 'created-desc': return b.createdAt - a.createdAt;
        case 'updated-desc': return b.updatedAt - a.updatedAt;
      }
    });
  }, [boxes, roomId, sel, sort]);

  async function handleAddBox() {
    if (!moveId) return;
    if (roomId === 'ALL') {
      alert('Choose a room first to add a box.');
      return;
    }
    setAdding(true);
    await createBox(moveId, roomId);
    setAdding(false);
    await loadAll();
  }

  async function handleDeleteBox(id: string) {
    const ok = confirm('Delete this box? All items and images in the box will also be deleted.');
    if (!ok) return;
    await deleteBox(id);
    await loadAll();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {/* Filters top row */}
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="mr-2">Room:</label>
            <select className="select" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              <option value="ALL">All Rooms</option>
              {rooms.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
            </select>
          </div>

          <div>
            <span className="mr-2">Filter:</span>
            {STATUS.map((s) => (
              <label key={s} className="mr-3 inline-flex items-center gap-1">
                <input type="checkbox" checked={!!sel[s]} onChange={(e) => setSel((v) => ({ ...v, [s]: e.target.checked }))} /> {s}
              </label>
            ))}
          </div>

          <div>
            <label className="mr-2">Sort:</label>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="select">
              <option value="number-asc">Number ↑</option>
              <option value="number-desc">Number ↓</option>
              <option value="created-desc">Most Recent (created)</option>
              <option value="updated-desc">Most Recent (updated)</option>
            </select>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleAddBox}
          title={roomId === 'ALL' ? 'Choose a room to add a box' : 'Add a new box in this room'}
        >
          {adding ? 'Adding…' : 'Add Box'}
        </button>
      </div>

      {/* Title below controls */}
      <h1 className="h1">Boxes</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.length === 0 ? (
          <div className="text-neutral-500">
            {roomId === 'ALL' ? 'Choose a room to view or add boxes.' : 'No boxes found in this room yet.'}
          </div>
        ) : (
          visible.map((b) => (
            <div key={b.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-semibold text-lg">#{b.number}</div>
                  <div className="text-sm text-neutral-600">Room: {roomsMap[b.roomId]?.name || '—'}</div>
                  <div className="text-sm text-neutral-600">Items: {itemCounts[b.id] ?? 0}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-600 mb-1">Status:</div>
                  <select
                    className="select"
                    value={b.status}
                    onChange={async (e) => {
                      await updateBoxStatus(b.id, e.target.value as BoxStatus);
                      const bx = await listBoxes(moveId!);
                      setBoxes(bx);
                    }}
                  >
                    {STATUS.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Link className="btn btn-ghost flex-1" to={`/moves/${b.moveId}/boxes/${b.id}`}>
                  Add/Edit Items
                </Link>
                <button className="btn btn-ghost text-red-600" onClick={() => handleDeleteBox(b.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
