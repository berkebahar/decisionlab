"use client";

import { useId, useState } from "react";
import { updateJournal, type SavedDecision, type DecisionJournal } from "../saved-decisions-storage";
import { notifyStorageChange } from "../use-local-storage";

export default function DecisionJournalEditor({ decision }: { decision: SavedDecision }) {
  const id = useId();
  const [journal, setJournal] = useState<DecisionJournal>(decision.journal ?? { outcome: "undecided", reason: "", reflection: "" });
  const [message, setMessage] = useState("");
  return <details className="journal-editor" onToggle={event => {
    if (event.currentTarget.open) setJournal(decision.journal ?? { outcome: "undecided", reason: "", reflection: "" });
  }}>
    <summary>Decision journal · {decision.journal?.outcome ?? "undecided"}</summary>
    <form onSubmit={event => {
      event.preventDefault();
      try { updateJournal(window.localStorage, decision.id, journal); notifyStorageChange(); setMessage("Journal saved."); }
      catch { setMessage("Could not save. Your existing record is preserved; check storage or refresh if it was deleted."); }
    }}>
      <p>There is no right answer. Record the choice that fits your needs. For comparisons, name your chosen option in the reason.</p>
      <label htmlFor={`${id}-outcome`}>Your decision</label>
      <select id={`${id}-outcome`} value={journal.outcome} onChange={e => { setJournal({ ...journal, outcome: e.target.value as DecisionJournal["outcome"] }); setMessage(""); }}>
        <option value="undecided">Undecided</option><option value="bought">Bought</option><option value="skipped">Skipped</option><option value="postponed">Postponed</option>
      </select>
      <label htmlFor={`${id}-reason`}>Reason <span>(optional, 500 characters)</span></label>
      <textarea id={`${id}-reason`} rows={2} maxLength={500} value={journal.reason} onChange={e => { setJournal({ ...journal, reason: e.target.value }); setMessage(""); }} />
      <label htmlFor={`${id}-reflection`}>Later reflection <span>(optional, 1,000 characters)</span></label>
      <textarea id={`${id}-reflection`} rows={3} maxLength={1000} placeholder="Was it useful? Would you choose differently?" value={journal.reflection} onChange={e => { setJournal({ ...journal, reflection: e.target.value }); setMessage(""); }} />
      <button className="button-outline" type="submit">Save journal</button><p role="status">{message}</p>
    </form>
  </details>;
}
