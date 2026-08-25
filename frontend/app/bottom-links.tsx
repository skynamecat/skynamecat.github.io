type BottomLinksProps = { compact?: boolean };

export function BottomLinks({ compact = false }: BottomLinksProps) {
  return (
    <section className={`bottom-links${compact ? " is-compact" : ""}`} aria-label="更多入口">
      <a className="bottom-link-row" href="/blindbox/">
        <span className="bottom-link-icon" aria-hidden="true">◇</span>
        <span className="bottom-link-copy">
          <strong>庞菠菠盲盒</strong>
          <small>拆一只今天的庞菠菠，收进你的图鉴。</small>
        </span>
        <span className="bottom-link-action" aria-hidden="true">进入 <i>→</i></span>
      </a>

    </section>
  );
}
