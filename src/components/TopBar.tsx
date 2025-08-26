import { Link, NavLink } from 'react-router-dom';
import { useUI } from '@/store';

function Tab({
  to,
  children,
  end = false,
}: {
  to: string;
  children: React.ReactNode;
  end?: boolean;
}) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
      {children}
    </NavLink>
  );
}

export default function TopBar() {
  const { currentMoveId } = useUI();
  const moveForLinks = currentMoveId || undefined;

  return (
    <header className="border-b">
      <div className="mx-auto max-w-6xl px-3 sm:px-4">
        <div className="h-14 flex items-center justify-between">
          <Link to="/" className="font-semibold">BoxLister</Link>
          <nav className="flex items-center gap-2">
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
