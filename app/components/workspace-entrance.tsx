import Image from "next/image";
import PageHeading from "./page-heading";
import BotanicalShade from "./botanical-shade";
import EditorialType from "./editorial-type";

export default function WorkspaceEntrance({ page, title, children, words }: { page: string; title: string; children: React.ReactNode; words: string }) {
  return <header className="workspace-entrance">
    <div className="workspace-botanical" aria-hidden="true" inert><Image src="/images/decisionlab-botanical-hero.webp" alt="" fill sizes="100vw" /></div>
    <EditorialType words={words} />
    <BotanicalShade placement="hero" />
    <div className="container"><PageHeading page={page} eyebrow={page} title={title}>{children}</PageHeading></div>
  </header>;
}
