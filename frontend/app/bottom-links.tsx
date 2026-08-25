type BottomLinksProps = {
  supportEmail?: string;
  compact?: boolean;
};

export function BottomLinks({ supportEmail, compact = false }: BottomLinksProps) {
  const email = supportEmail?.trim();

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

      {email ? (
        <a className="bottom-link-row" href={`mailto:${email}`}>
          <span className="bottom-link-icon" aria-hidden="true">＠</span>
          <span className="bottom-link-copy"><strong>客服邮箱</strong><small>{email}</small></span>
          <span className="bottom-link-action" aria-hidden="true">写信 <i>↗</i></span>
        </a>
      ) : (
        <div className="bottom-link-row is-disabled">
          <span className="bottom-link-icon" aria-hidden="true">＠</span>
          <span className="bottom-link-copy"><strong>客服邮箱</strong><small>待设置</small></span>
          <span className="bottom-link-action">COMING SOON</span>
        </div>
      )}
    </section>
  );
}
