/** Original vector foliage: decorative, local, and independent of product content. */
export default function BotanicalShade({ placement }: { placement: "hero" | "receipt" | "queue" }) {
  return <div className={`botanical-shade botanical-shade-${placement}`} aria-hidden="true">
    <svg data-atmosphere-reveal="foliage" viewBox="0 0 640 360" fill="none" focusable="false">
      <path className="botanical-shade-stem" d="M660 18C480 75 470 257 232 342M536 105L380 90M480 187L591 260M380 283L245 223" />
      <g className="botanical-shade-leaves">
        <path d="M541 102C521 14 426 9 380 30C414 91 469 122 541 102Z" />
        <path d="M504 150C541 57 622 56 647 66C615 142 564 174 504 150Z" />
        <path d="M468 203C460 125 370 109 317 125C348 184 406 216 468 203Z" />
        <path d="M428 247C484 199 568 216 591 260C526 287 475 286 428 247Z" />
        <path d="M366 293C350 224 274 196 222 214C244 271 298 304 366 293Z" />
        <path d="M297 326C351 298 431 314 455 351C391 373 338 361 297 326Z" />
      </g>
    </svg>
  </div>;
}
