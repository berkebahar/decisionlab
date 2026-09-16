/** Print a snapshot outside application grids, clipped panels, and sticky layers. */
export function printReceipt(receipt: HTMLElement): () => void {
  const root = document.createElement("div");
  root.className = "receipt-print-root";
  const copy = receipt.cloneNode(true) as HTMLElement;
  copy.classList.add("receipt-print-target");
  copy.classList.remove("receipt-compact");
  // No duplicate document IDs or live announcements in the print-only snapshot.
  for (const element of [copy, ...copy.querySelectorAll<HTMLElement>("*")]) {
    for (const attribute of ["id", "aria-labelledby", "aria-describedby", "aria-live"]) element.removeAttribute(attribute);
  }
  copy.querySelectorAll("details").forEach(details => { details.open = true; });
  copy.querySelectorAll("button").forEach(button => button.remove());
  root.append(copy);
  document.body.append(root);
  document.body.classList.add("receipt-printing");

  const media = window.matchMedia("print");
  let enteredPrint = media.matches;
  const cleanup = () => {
    window.removeEventListener("afterprint", cleanup);
    media.removeEventListener("change", onMediaChange);
    root.remove();
    document.body.classList.remove("receipt-printing");
  };
  const onMediaChange = (event: MediaQueryListEvent) => {
    if (event.matches) enteredPrint = true;
    else if (enteredPrint) cleanup();
  };
  window.addEventListener("afterprint", cleanup, { once: true });
  media.addEventListener("change", onMediaChange);
  try {
    window.print();
  } catch (error) {
    cleanup();
    throw error;
  }
  // Do not clean up on return: some browsers open their print UI asynchronously.
  return cleanup;
}
