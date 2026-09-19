"use client";

export default function WorkspaceError({ retry }: { retry: () => void }) {
  return <div className="container product-page">
    <section className="product-empty" role="alert">
      <p className="eyebrow">DecisionLab</p>
      <h2>This page could not open.</h2>
      <p>Try again, or reload the page. Your saved records are preserved.</p>
      <div className="product-actions"><button className="button-primary" type="button" onClick={retry}>Try again</button><a className="button-outline" href="">Reload page</a></div>
    </section>
  </div>;
}
