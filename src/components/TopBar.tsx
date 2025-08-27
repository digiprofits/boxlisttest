import { Link, NavLink } from 'react-router-dom';
import { useUI } from '@/store';

function Tab({ to, children, end = false }: { to: string; children: React.ReactNode; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50'}`
      }
    >
      {children}
    </NavLink>
  );
}

export default function TopBar() {
  const { currentMoveId } = useUI();
  const moveForLinks = currentMoveId || undefined;

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="py-2 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold shrink-0">
            <img src="/logo.png" alt="BoxLister" className="h-6 w-6" />
          </Link>

          {/* Tabs that wrap to a second line when needed */}
          <nav className="flex flex-wrap items-center gap-1 justify-end max-w-full">
            <Tab to="/" end>Moves</Tab>
            {moveForLinks && (
              <>
                <Tab to={`/moves/${moveForLinks}/rooms`}>Rooms</Tab>
                <Tab to={`/moves/${moveForLinks}/boxes`}>Boxes</Tab>
                <Tab to={`/moves/${moveForLinks}/search`}>Search</Tab>
                <Tab to={`/moves/${moveForLinks}/settings`}>Settings</Tab>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
