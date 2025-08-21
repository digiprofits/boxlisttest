import { Link } from 'react-router-dom';
import { useUI } from '@/store';

export default function TopBar(){
  const { currentMoveId } = useUI();
  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="BoxList" className="h-7 w-7 rounded-md" />
        </Link>
        <nav className="ml-auto flex items-center gap-2">
          <Link to="/" className="btn btn-ghost">Moves</Link>
          {currentMoveId && (
            <>
              <Link to={`/moves/${currentMoveId}/boxes`} className="btn btn-ghost">Boxes</Link>
              <Link to={`/moves/${currentMoveId}/items`} className="btn btn-ghost">Items</Link>
              <Link to={`/moves/${currentMoveId}/search`} className="btn btn-ghost">Search</Link>
              <Link to={`/moves/${currentMoveId}/settings`} className="btn btn-ghost">Settings</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
