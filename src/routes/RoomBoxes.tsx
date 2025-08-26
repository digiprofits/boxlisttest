import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createBox, listBoxesInRoom, nextBoxNumber, updateBoxStatus, useUI } from '@/store';
import type { BoxStatus } from '@/types';

const STATUS: BoxStatus[] = ['open', 'packed', 'sealed', 'unpacked'];

type SortKey =
  | 'number-asc'
  | 'number-desc'
  | 'name-asc'
  | 'name-desc'
  | 'created-desc'
  | 'updated-desc';

type Box = {
  id: string;
  moveId: string;
  roomId: string;
  number: string;
  name: string;
  status: BoxStatus;
  images?: string[];
  createdAt: number;
  updatedAt: number;
};

export default function RoomBoxes() {
  const { moveId, roomId } = useParams();
  const { setCurrentMove } = useUI();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Record<BoxStatus, boolean>>({
    open: true,
    packed: true,
    sealed: true,
    unpacked: true,
  });
  const [sort, setSort] = useState<SortKey>('number-asc');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (moveId) setCurrentMove(moveId);
  }, [moveId]);

  useEffect(() => {
    (async () => {
      if (!roomId) return;
      setLoading(true);
      const list = await listBoxesInRoom(roomId);
      setBoxes(list);
      setLoading(false);
    })();
  }, [roomId]);

  const visible = useMemo(() => {
    const filtered = boxes.filter((b) => sel[b.status]);
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'number-asc':
          return a.number.localeCompare(b.number, undefined, { numeric: true });
        case 'number-desc':
          return b.number.localeCompare(a.number, undefined, { numeric: true });
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'created-desc':
          return b.createdAt - a.createdAt;
        case 'updated-desc':
          return b.updatedAt - a.updatedAt;
      }
    });
  }, [boxes, sel, sort]);

  async function addBox() {
    const name = nameRef.current!.value.trim();
    if (!name) return;
    const res = await createBox(moveId!, roomId!, name);
    if ((res as any)?.error === 'DUPLICATE_NUMBER') {
      alert('Box number conflict');
      return;
    }
    nameRef.current!.value = '';
    setBoxes(await listBoxesInRoom(roomId!));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="h1">Boxes</h1>
        <div className="flex gap-2">
          <input
            ref={nameRef}
            className="input"
            placeholder="New box name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addBox();
              }
            }}
          />
          <button className="btn btn-primary" onClick={addBox}>
            Add Box
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
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
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="created-desc">Most Recent (created)</option>
            <option value="updated-desc">Most Recent (updated)</option>
          </select>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <div className="text-neutral-500">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="text-neutral-500">No boxes found.</div>
        ) : (
          visible.map((b) => (
            <div key={b.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">
                  <span className="text-neutral-500 mr-1">#{b.number}</span>
                  {b.name}
                </div>
                <span className={`status-pill status-${b.status}`}>{b.status}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <Link className="btn btn-ghost" to={`/moves/${b.moveId}/boxes/${b.id}`}>
                  Open
                </Link>
                <button
                  className="btn btn-ghost"
                  onClick={async () => {
                    const cycle: BoxStatus[] = ['open', 'packed', 'sealed', 'unpacked'];
                    const next =
                      cycle[(cycle.indexOf(b.status) + 1) % cycle.length];
                    await updateBoxStatus(b.id, next);
                    setBoxes(await listBoxesInRoom(roomId!));
                  }}
                >
                  Cycle Status
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
