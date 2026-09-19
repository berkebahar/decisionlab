"use client";

import { useRef, useState } from "react";
import { commitImport, MAX_BACKUP_BYTES, parseBackup, previewImport, readBackup } from "../data-backup";
import { notifyStorageChange } from "../use-local-storage";

export default function DataBackup() {
  const [preview, setPreview] = useState<ReturnType<typeof previewImport> | null>(null);
  const [message, setMessage] = useState("");
  const request = useRef(0);
  return <section className="backup-panel container" aria-labelledby="backup-heading">
    <div><p className="eyebrow">Your records, in your hands</p><h2 id="backup-heading">Keep a local backup.</h2><p>This backup covers local browser records only; it does not export or import cloud records. Clearing browser data may erase them. Export a file to keep product analyses, queue decisions, purchase reviews, goals, comparisons, journals, and scenarios. Importing adds records to this browser only, even while signed in. Backup files contain your personal entries; keep them private.</p></div>
    <div className="backup-controls">
      <button type="button" className="button-outline" onClick={() => {
        try {
          const raw = JSON.stringify(readBackup(window.localStorage), null, 2);
          parseBackup(raw); // Every exported file must also be importable.
          const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
          const link = document.createElement("a"); link.href = url; link.download = "decisionlab-backup.json"; link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage("Backup download requested.");
        } catch { setMessage("Could not export. Storage may be unavailable, unreadable, or beyond the 1 MB backup limit. Existing records are unchanged."); }
      }}>Export backup</button>
      <label htmlFor="backup-file">Import a DecisionLab backup (JSON, up to 1 MB)</label>
      <input id="backup-file" type="file" accept=".json,application/json" onChange={async event => {
        const file = event.target.files?.[0]; const token = ++request.current; setPreview(null); setMessage("");
        if (!file) return;
        try {
          if (file.size > MAX_BACKUP_BYTES) throw new Error("Choose a backup smaller than 1 MB.");
          const raw = await file.text(); if (token !== request.current) return;
          setPreview(previewImport(window.localStorage, parseBackup(raw)));
        } catch (error) { if (token === request.current) setMessage(error instanceof Error ? error.message : "Could not read this backup."); }
      }} />
      {preview && <div className="import-preview" role="region" aria-label="Import preview">
        <h3>Review before importing</h3><p>Add {preview.additions.products} products, {preview.additions.goals} goals, {preview.additions.decisions} comparisons, and {preview.additions.scenarios} scenarios. Existing IDs, including their journal entries, are kept unchanged. Nothing is replaced or deleted.</p>
        <div className="goal-actions"><button type="button" className="button-primary" onClick={() => {
          try { commitImport(window.localStorage, preview); notifyStorageChange(); setPreview(null); setMessage("Backup imported. Existing records were preserved."); }
          catch (error) { setMessage(error instanceof Error ? error.message : "Import failed."); }
        }}>Confirm import</button><button type="button" className="button-outline" onClick={() => { setPreview(null); setMessage("Import cancelled. Records unchanged."); }}>Cancel</button></div>
      </div>}
      <p role="status">{message}</p>
    </div>
  </section>;
}
