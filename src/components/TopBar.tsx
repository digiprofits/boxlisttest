import { Link, NavLink, useLocation } from 'react-router-dom';
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
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}
    >
      {children}
    </NavLink>
  );
}

export default function TopBar() {
  const { currentMoveId } = useUI();
  const { pathname } = useLocation();

  // Prefer moveId from the URL so links & active state always match the page
  const moveFromPath = pathname.match(/\/moves\/([^/]+)/)?.[1];
  const moveForLinks = moveFromPath || currentMoveId;

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="BoxLister" className="h-7 w-7 rounded-md" />
        </Link>

        <nav className="ml-2 sm:ml-4 flex-1 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2">
            <Tab to="/" end>Moves</Tab>
            {moveForLinks && (
              <>
                <Tab to={`/moves/${moveForLinks}/boxes`}>Boxes</Tab>
                <Tab to={`/moves/${moveForLinks}/items`}>Items</Tab>
                <Tab to={`/moves/${moveForLinks}/search`}>Search</Tab>
                <Tab to={`/moves/${moveForLinks}/settings`}>Settings</Tab>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
