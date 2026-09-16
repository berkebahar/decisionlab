import Link from "next/link";

export default function PageHeading({ eyebrow, title, children, page = "Your workspace" }: { eyebrow: string; title: string; children: React.ReactNode; page?: string }) {
  return <div className="page-heading"><nav className="page-context" aria-label="Breadcrumb"><Link href="/">DecisionLab</Link><span aria-hidden="true">/</span><span aria-current="page">{page}</span></nav><p className="eyebrow"><span className="status-dot" />{eyebrow}</p><h1>{title}</h1><p>{children}</p></div>;
}
