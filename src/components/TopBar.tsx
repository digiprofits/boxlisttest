import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useUI } from '@/store';

function Tab({ to, children, end = false, onClick }: { to: string; children: React.ReactNode; end?: boolean; onClick?: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`
      }
      onClick={onClick}
    >
      {children}
    </NavLink>
  );
}

export default function TopBar() {
  const { currentMoveId } = useUI();
  const moveForLinks = currentMoveId || undefined;
  const [open, setOpen] = useState(false);

  const Tabs = ({ onItem }: { onItem?: () => void }) => (
    <>
      <Tab to="/" end onClick={onItem}>Moves</Tab>
      {moveForLinks && (
        <>
          <Tab to={`/moves/${moveForLinks}/rooms`} onClick={onItem}>Rooms</Tab>
          <Tab to={`/moves/${moveForLinks}/boxes`} onClick={onItem}>Boxes</Tab>
          <Tab to={`/moves/${moveForLinks}/search`} onClick={onItem}>Search</Tab>
          <Tab to={`/moves/${moveForLinks}/settings`} onClick={onItem}>Settings</Tab>
        </>
      )}
    </>
  );

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold shrink-0">
            <img src="/logo.svg" alt="BoxLister" className="h-6 w-6" />
            {/* Removed wordmark to free space */}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Tabs />
          </nav>

          {/* Mobile hamburger */}
          <div className="md:hidden relative">
            <button
              className="btn btn-ghost"
              aria-label="Open menu"
              onClick={() => setOpen((v) => !v)}
            >
              ☰
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-48 rounded-md border bg-white shadow-md p-2 z-50">
                <Tabs onItem={() => setOpen(false)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
