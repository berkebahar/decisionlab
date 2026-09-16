export default function DecisionPath({ compact = false }: { compact?: boolean }) {
  return <svg className={`decision-path${compact ? " compact" : ""}`} viewBox="0 0 560 210" fill="none" aria-hidden="true">
    <path className="path-grid" d="M0 35H560M0 70H560M0 105H560M0 140H560M0 175H560M35 0V210M70 0V210M105 0V210M140 0V210M175 0V210M210 0V210M245 0V210M280 0V210M315 0V210M350 0V210M385 0V210M420 0V210M455 0V210M490 0V210M525 0V210" />
    <path className="path-alternative" d="M40 142H135C185 142 185 182 235 182H493" />
    <path className="path-primary" d="M40 142H135C195 142 190 70 250 70H325C377 70 382 35 433 35H495" />
    <circle className="path-node" cx="40" cy="142" r="8" /><circle className="path-node" cx="250" cy="70" r="7" />
    <circle className="path-target" cx="497" cy="35" r="17" /><circle className="path-node" cx="497" cy="35" r="6" />
    <circle className="path-end" cx="497" cy="182" r="6" />
    <text x="38" y="117">TODAY</text><text x="535" y="10" textAnchor="end">A LITTLE PERSPECTIVE</text><text x="535" y="164" textAnchor="end">ANOTHER POSSIBILITY</text>
  </svg>;
}
