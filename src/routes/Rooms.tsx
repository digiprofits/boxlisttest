import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createRoom, deleteRoom, listRooms, listBoxes, updateRoom, useUI } from '@/store';
import InlineEditable from '@/components/InlineEditable';

export default function Rooms() {
  const { moveId } = useParams();
  const { setCurrentMove } = useUI();
  const [rooms, setRooms] = useState<any[]>([]);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (moveId) setCurrentMove(moveId); }, [moveId]);
  useEffect(() => {
    (async () => {
      if (!moveId) return;
      setRooms(await listRooms(moveId));
    })();
  }, [moveId]);

  async function addRoom() {
    const name = nameRef.current!.value.trim();
    if (!name) return;
    await createRoom(moveId!, name);
    nameRef.current!.value = '';
    setRooms(await listRooms(moveId!));
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
      <div className="flex items-center justify-between">
        <h1 className="h1">Rooms</h1>
        <div className="flex gap-2">
          <input
            ref={nameRef}
            className="input"
            placeholder="Add a room (e.g., Kitchen)"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRoom(); } }}
          />
          <button className="btn btn-primary" onClick={addRoom}>Add</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rooms.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center justify-between gap-3">
              <InlineEditable value={r.name} onSave={(v) => rename(r.id, v)} />
              <div className="flex gap-2">
                <Link className="btn btn-ghost" to={`/moves/${moveId}/rooms/${r.id}/boxes`}>Open</Link>
                <button className="btn btn-ghost text-red-600" onClick={() => remove(r.id)}>Delete</button>
              </div>
            </div>
            <RoomMeta moveId={moveId!} roomId={r.id} />
          </div>
        ))}
        {rooms.length === 0 && (
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
