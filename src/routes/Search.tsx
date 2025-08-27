import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listBoxes, listAllItemsInMove, listRooms, useUI } from '@/store';

export default function Search() {
  const { moveId } = useParams();
  const { setCurrentMove } = useUI();
  const [boxes, setBoxes] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [roomsMap, setRoomsMap] = useState<Record<string, any>>({});
  const [q, setQ] = useState('');

  useEffect(() => { if (moveId) setCurrentMove(moveId); }, [moveId]);

  useEffect(() => {
    (async () => {
      if (!moveId) return;
      const [bx, it, rms] = await Promise.all([
        listBoxes(moveId),
        listAllItemsInMove(moveId),
        listRooms(moveId),
      ]);
      setBoxes(bx);
      setItems(it);
      setRoomsMap(Object.fromEntries(rms.map((r) => [r.id, r])));
    })();
  }, [moveId]);

  const qb = q.toLowerCase();
  const b = useMemo(() => boxes.filter((x: any) => (x.name || '').toLowerCase().includes(qb)), [boxes, qb]);
  const i = useMemo(() => items.filter((x: any) => (x.name || '').toLowerCase().includes(qb)), [items, qb]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <input
          className="input w-full"
          placeholder="Search boxes & items"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold mb-2">Boxes</h2>
          <div className="space-y-2">
            {b.map((x: any) => (
              <Link
                key={x.id}
                to={`/moves/${moveId}/boxes/${x.id}`}
                className="block p-2 rounded-lg hover:bg-neutral-50 border"
              >
                <div className="font-medium">
                  <span className="text-neutral-500 mr-1">#{x.number}</span>
                  {x.name?.trim() ? x.name : 'Box'}
                </div>
                <div className="text-sm text-neutral-600">
                  {roomsMap[x.roomId]?.name ? `Room: ${roomsMap[x.roomId].name}` : ''}
                </div>
              </Link>
            ))}
            {b.length === 0 && <div className="text-neutral-500">No boxes found.</div>}
          </div>
        </div>

        <div>
          <h2 className="font-semibold mb-2">Items</h2>
          <div className="space-y-2">
            {i.map((x: any) => {
              const box = boxes.find((bb: any) => bb.id === x.boxId);
              const roomName = box ? roomsMap[box.roomId]?.name : '';
              const boxNum = box?.number ? `#${box.number}` : '';
              return (
                <Link
                  key={x.id}
                  to={`/moves/${moveId}/boxes/${x.boxId}`}
                  className="block p-2 rounded-lg hover:bg-neutral-50 border"
                >
                  <div className="font-medium">{x.name}</div>
                  <div className="text-sm text-neutral-600">
                    {boxNum && <>Box {boxNum}&nbsp;&nbsp;•&nbsp;&nbsp;</>}
                    {roomName ? `Room: ${roomName}` : ''}
                  </div>
                </Link>
              );
            })}
            {i.length === 0 && <div className="text-neutral-500">No items found.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
