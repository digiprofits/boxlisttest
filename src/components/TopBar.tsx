import { Link, NavLink } from 'react-router-dom';
import { useUI } from '@/store';
import InstallPrompt from '@/components/InstallPrompt';

function Tab({ to, children }:{ to:string; children:React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}
    >
      {children}
    </NavLink>
  );
}

export default function TopBar(){
  const { currentMoveId } = useUI();

  return (
    <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="BoxLister" className="h-7 w-7 rounded-md" />
        </Link>

        <nav className="ml-2 sm:ml-4 flex-1 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2">
            <Tab to="/">Moves</Tab>
            {currentMoveId && (
              <>
                <Tab to={`/moves/${currentMoveId}/boxes`}>Boxes</Tab>
                <Tab to={`/moves/${currentMoveId}/items`}>Items</Tab>
                <Tab to={`/moves/${currentMoveId}/search`}>Search</Tab>
                <Tab to={`/moves/${currentMoveId}/settings`}>Settings</Tab>
              </>
            )}
          </div>
        </nav>

        {/* Optional install button if you kept it */}
        <InstallPrompt />
      </div>
    </header>
  );
}
