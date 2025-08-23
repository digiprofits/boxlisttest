import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { exportJSON, importJSON, listMoves, listBoxes, listItemsInBox } from '@/store';
import { itemsToCSV } from '@/utils/csv';
import { download } from '@/utils/download';

export default function Settings() {
  const nav = useNavigate();
  const { moveId } = useParams();

  const [moves, setMoves] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const mv = await listMoves();
      setMoves(mv);

      const allBoxes: any[] = [];
      const allItems: any[] = [];
      for (const m of mv) {
        const bx = await listBoxes(m.id);
        allBoxes.push(...bx);
        for (const b of bx) {
          const it = await listItemsInBox(b.id);
          allItems.push(...it);
        }
      }
      setBoxes(allBoxes);
      setItems(allItems);
    })();
  }, []);

  async function doExportJSON() {
    const data = await exportJSON();
    download('boxlister-backup.json', JSON.stringify(data, null, 2));
  }

  function handleImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        await importJSON(JSON.parse(String(reader.result)));
        alert('Import complete. Reload to see changes.');
      } catch (err) {
        alert('Import failed: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  }

  function doExportCSV() {
    const csv = itemsToCSV(moves, boxes, items);
    download('boxlister-inventory.csv', csv, 'text/csv');
  }

  // --- New: reset the install screen/banner memory flags ---
  function resetInstallHints() {
    // Full-screen Install Gate
    localStorage.removeItem('boxlister.installGate.dismissed');
    // Older inline/banner helpers (safe to clear even if unused)
    localStorage.removeItem('boxlister.install.dismissed');
    alert('Install screen has been reset. Reload the page to see it again.');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Settings &amp; Data</h1>

      {/* Install & UX */}
      <div className="card p-4 space-y-3">
        <div className="font-medium">Install &amp; UX</div>
        <p className="text-sm text-neutral-600">
          Show the install screen again on next load.
        </p>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={resetInstallHints}>
            Reset Install Screen
          </button>
        </div>
      </div>

      {/* Data Export / Import */}
      <div className="card p-4 space-y-4">
        <div className="font-medium">Data Export / Import</div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button className="btn btn-primary w-full" onClick={doExportJSON}>
            Export JSON
            <br className="hidden sm:block" />
            (Full Backup)
          </button>

          <label className="btn btn-ghost w-full cursor-pointer text-center">
            Import JSON
            <input
              type="file"
              className="hidden"
              accept="application/json"
              onChange={handleImportJSON}
            />
          </label>

          <button className="btn btn-ghost w-full" onClick={doExportCSV}>
            Export CSV
            <br className="hidden sm:block" />
            (Inventory)
          </button>

          <button
            className="btn btn-ghost w-full disabled:opacity-50"
            onClick={() => nav(`/moves/${moveId}/labels`)}
            disabled={!moveId}
            title={!moveId ? 'Create/select a move first' : undefined}
          >
            Printable Labels
          </button>
        </div>

        <p className="text-sm text-neutral-600">
          JSON includes all moves, boxes, and items. CSV is a flat inventory list.
        </p>
      </div>
    </div>
  );
}
