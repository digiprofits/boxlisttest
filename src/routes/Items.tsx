// src/routes/Items.tsx
import { Link, useParams } from 'react-router-dom';

export default function ItemsRedirect() {
  const { moveId } = useParams();
  return (
    <div className="space-y-4">
      <h1 className="h1">Items view has moved</h1>
      <p className="text-neutral-700">
        The standalone <strong>Items</strong> page has been removed. 
        You can manage items inside each <strong>Box</strong>, and find anything via <strong>Search</strong>.
      </p>
      <div className="flex gap-2">
        <Link className="btn btn-primary" to={`/moves/${moveId}/boxes`}>Go to Boxes</Link>
        <Link className="btn" to={`/moves/${moveId}/search`}>Open Search</Link>
        <Link className="btn" to={`/moves/${moveId}/rooms`}>Go to Rooms</Link>
      </div>
    </div>
  );
}
