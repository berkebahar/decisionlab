"use client";

import { useCallback, useSyncExternalStore } from "react";

const CHANGE_EVENT = "decisionlab:storage-change";
export const STORAGE_UNAVAILABLE = "storage-unavailable";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getServerSnapshot() { return undefined; }

export function notifyStorageChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useLocalStorage(key: string) {
  const getSnapshot = useCallback(() => {
    try { return window.localStorage.getItem(key); }
    catch { return STORAGE_UNAVAILABLE; }
  }, [key]);
  // An undefined server snapshot prevents an empty-state flash before hydration.
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
