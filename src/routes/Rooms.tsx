import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createRoom, deleteRoom, listBoxes, listRooms, updateRoom, useUI } from '@/store';
import InlineEditable from '@/components/InlineEditable';

type SortKey = 'name-asc' | 'name-desc' | 'updated-desc';

export default function Rooms() {
  const { moveId } = useParams();
  const nav = useNavigate();
  const { setCurrentMove } = useUI();
  const [rooms, setRooms] = useState<any[]>([]);
  const [sort, setSort] = useState<SortKey>('name-asc');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (moveId) setCurrentMove(moveId);
  }, [moveId]);

  useEffect(() => {
    (async () => {
      if (!moveId) return;
      setRooms(await listRooms(moveId));
    })();
  }, [moveId]);

  const sorted = useMemo(() => {
    const list = [...rooms];
    switch (sort) {
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'updated-desc':
        return list.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  }, [rooms, sort]);

  async function addRoom() {
    const name = nameRef.current!.value.trim();
    if (!name) return;
    const r = await createRoom(moveId!, name);
    nameRef.current!.value = '';
    setRooms(await listRooms(moveId!));
    // Go straight to Boxes filtered to the new room
    nav(`/moves/${moveId}/boxes?roomId=${r.id}`);
  }

  async function rename(id: string, name: string) {
    await updateRoom(id, { name });
    setRooms(await listRooms(moveId!));
  }

  async function remove(id: string) {
    if (!confirm('Delete this room? This will also delete all boxes and items in it.')) return;
    await deleteRoom(id);
    setRooms(await listRooms(moveId!));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="h1">Rooms</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-neutral-600">Sort:</label>
          <select className="select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="updated-desc">Most Recent</option>
          </select>
          <input
            ref={nameRef}
            className="input"
            placeholder="Add a room (e.g., Kitchen)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addRoom();
              }
            }}
          />
          <button className="btn btn-primary" onClick={addRoom}>
            Add
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center justify-between gap-3">
              <InlineEditable value={r.name} onSave={(v) => rename(r.id, v)} />
              <div className="flex gap-2">
                <Link className="btn btn-ghost" to={`/moves/${moveId}/boxes?roomId=${r.id}`}>
                  Open
                </Link>
                <button className="btn btn-ghost text-red-600" onClick={() => remove(r.id)}>
                  Delete
                </button>
              </div>
            </div>
            <RoomMeta moveId={moveId!} roomId={r.id} />
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="text-neutral-600">
            No rooms yet. Try adding <em>Kitchen</em>, <em>Master Bedroom</em>, <em>Living</em>…
          </div>
        )}
      </div>
    </div>
  );
}

function RoomMeta({ moveId, roomId }: { moveId: string; roomId: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    (async () => {
      const list = await listBoxes(moveId);
      setCount(list.filter((b) => b.roomId === roomId).length);
    })();
  }, [moveId, roomId]);
  return <div className="text-sm text-neutral-600 mt-2">Boxes: {count}</div>;
}
