"use client";
import Link from "next/link";
import { useProducts } from "./use-products";
export default function StorageStatus() {
  const { mode, loading, saving, error, refresh } = useProducts();
  return <div className="product-local-note">
    <p role="status">{mode === "pending" ? "Checking account connection. Saving is paused." : mode === "cloud" ? `${saving ? "Saving to your account…" : loading ? "Loading cloud records…" : error ? "Cloud sync needs attention." : "Cloud storage · signed in."} Local records remain separate.` : "Local-only storage · saved in this browser. Clearing browser data can erase these records."}</p>
    <Link className="text-link" href="/account">Account</Link>{mode === "cloud" && <button className="text-link" type="button" disabled={saving || loading} onClick={refresh}>Refresh cloud records</button>}
  </div>;
}
