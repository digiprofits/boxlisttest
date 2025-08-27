import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { exportJSON, importJSON, useUI } from '@/store';
import { itemsToCSV } from '@/utils/csv';
import { download } from '@/utils/download';

export default function Settings() {
  const { moveId } = useParams();
  const { setCurrentMove } = useUI();

  useEffect(() => { if (moveId) setCurrentMove(moveId); }, [moveId]);

  async function handleExportJSON() {
    const s = await exportJSON();
    download('boxlister-backup.json', s, 'application/json');
  }

  async function handleExportCSV() {
    const csv = await itemsToCSV(moveId!);
    download('boxlister-inventory.csv', csv, 'text/csv');
  }

  async function handleImportJSON() {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json';
    inp.onchange = async () => {
      const file = inp.files?.[0];
      if (!file) return;
      const text = await file.text();
      const res = await importJSON(text, { mode: 'merge' });
      if (!res.ok) alert('Import failed');
      else alert('Import complete');
    };
    inp.click();
  }

  return (
    <div className="space-y-8">
      <h1 className="h1">Settings &amp; Data</h1>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">Install &amp; UX</h2>
        <button
          className="btn btn-ghost"
          onClick={() => {
            localStorage.removeItem('install-dismissed');
            alert('Install screen will be shown again on next load.');
          }}
        >
          Reset Install Screen
        </button>

        <div className="pt-2">
          <h3 className="font-medium mb-1">How to Install BoxLister</h3>
          <ul className="list-disc pl-6 space-y-1 text-sm text-neutral-700">
            <li><span className="font-semibold">iOS (Safari):</span> tap <em>Share</em> → <em>Add to Home Screen</em>.</li>
            <li><span className="font-semibold">Android (Chrome):</span> tap <em>⋮</em> → <em>Install App</em>.</li>
          </ul>
          <a
            href="https://web.dev/learn/pwa"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline text-sm"
          >
            Learn more about PWAs
          </a>
        </div>
      </section>

      <section className="card p-5 space-y-3">
        <h2 className="font-semibold">Data Export / Import</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <button className="btn btn-primary" onClick={handleExportJSON}>Export JSON (Full Backup)</button>
          <button className="btn btn-ghost" onClick={handleImportJSON}>Import JSON</button>
          <button className="btn btn-ghost" onClick={handleExportCSV}>Export CSV (Inventory)</button>
          <a className="btn btn-ghost" href={`/moves/${moveId}/labels`}>Printable Labels</a>
        </div>
        <p className="text-sm text-neutral-600">JSON includes all moves, rooms, boxes, and items. CSV is a flat inventory list.</p>
      </section>

      <section className="card p-5 space-y-2">
        <h2 className="font-semibold">About</h2>
        <p className="text-sm text-neutral-700">
          BoxLister © {new Date().getFullYear()}. All rights reserved. Domains: <strong>boxlister.com</strong> and <strong>boxlister.app</strong>.
        </p>
        <p className="text-sm text-neutral-700">
          BoxLister is the brainchild of <strong>Nathan Sullivan</strong> and <strong>Matthew Clark</strong>.
        </p>
        <p className="text-xs text-neutral-500 pt-2">
          Legal: This software is provided “as is” without warranties of any kind. You are responsible for exporting and backing up your data. 
          Use of brand names and assets is subject to local laws. By using this app, you agree to the Terms that may be published at the above domains.
        </p>
      </section>
    </div>
  );
}
