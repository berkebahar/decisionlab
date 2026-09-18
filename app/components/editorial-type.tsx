/** Atmosphere only. The homepage's existing observer and pause control govern its loop. */
export default function EditorialType({ words, loop = false }: { words: string; loop?: boolean }) {
  return <div className={`editorial-type${loop ? " editorial-type-loop" : ""}`} aria-hidden="true" inert data-atmosphere-reveal={loop ? "typography" : undefined}>
    <div className="editorial-type-track"><span>{words} · </span>{loop && <span>{words} · </span>}</div>
  </div>;
}
