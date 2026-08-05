import type { Metadata } from "next";
import { ThemeControl } from "./theme-control";

export const metadata: Metadata = {
  title: "404 — skynamecat",
  description: "这片角落暂时没有内容。",
};

export default function NotFound() {
  return (
    <main className="not-found-page">
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="返回首页">
          skynamecat<span>°</span>
        </a>
        <ThemeControl />
      </header>
      <section className="not-found-content">
        <div className="error-meta">
          <p className="section-label">LOST IN SPACE / 走远了</p>
          <p className="error-code" aria-hidden="true">404</p>
        </div>
        <div className="error-message">
          <p>也许页面搬走了，或者它还没开始生长。</p>
          <a className="home-link" href="/">
            回到安静的地方 <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
      <div className="moon not-found-moon" aria-hidden="true">
        <i className="moon-crater crater-one" />
        <i className="moon-crater crater-two" />
        <i className="moon-crater crater-three" />
      </div>
    </main>
  );
}
