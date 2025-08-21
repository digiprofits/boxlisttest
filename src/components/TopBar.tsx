import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { listMoves, useUI } from '@/store';

export default function TopBar() {
  const { currentMoveId } = useUI();
  const [moves, setMoves] = useState<any[]>([]);

  useEffect(() => {
    listMoves().then(setMoves);
  }, [currentMoveId]);

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <Link to="/" className="text-lg font-semibold tracking-tight">Box It Up</Link>
        <nav className="ml-auto flex items-center gap-2">
          <Link to="/" className="btn btn-ghost">Moves</Link>
          {currentMoveId && (
            <>
              <Link to={`/moves/${currentMoveId}/boxes`} className="btn btn-ghost">Boxes</Link>
              <Link to={`/moves/${currentMoveId}/labels`} className="btn btn-ghost">Labels</Link>
              <Link to={`/moves/${currentMoveId}/settings`} className="btn btn-ghost">Settings</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}