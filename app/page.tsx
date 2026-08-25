import { DisplayModeControl } from "./display-mode-control";
import { MusicControl } from "./music-control";
import { PangboboLoader } from "./pangbobo-loader";
import { ThemeControl } from "./theme-control";

const notes = [
  {
    number: "01",
    title: "保持好奇",
    text: "收集那些让人停下来多看一眼的技术、文字与微小灵感。",
  },
  {
    number: "02",
    title: "慢慢做好",
    text: "不追逐所有热闹，只把真正喜欢的东西做得清楚、耐用。",
  },
  {
    number: "03",
    title: "留点空白",
    text: "网页和生活都不必塞满。舒服，往往来自恰到好处。",
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="回到首页">
          skynamecat<span>°</span>
        </a>
        <div className="header-actions">
          <nav aria-label="主导航">
            <a href="#about">关于</a>
            <a href="#notes">片段</a>
            <a href="https://github.com/skynamecat" target="_blank" rel="noreferrer">
              GitHub <span aria-hidden="true">↗</span>
            </a>
          </nav>
          <DisplayModeControl />
          <ThemeControl />
        </div>
      </header>

      <div className="standard-home">
        <section className="hero" id="top">
        <div className="eyebrow"><i /> 欢迎来坐坐</div>
        <h1>
          在数字世界里，
          <br />
          留一块<span className="accent">安静的地方</span>。
        </h1>
        <p className="intro">
          你好，我是 skynamecat。这里收留正在发生的想法、做过的小东西，
          以及一些不急着抵达的探索。
        </p>
        <a className="scroll-cue" href="#about">
          往下看看 <span aria-hidden="true">↓</span>
        </a>
        <div className="orb orb-one" aria-hidden="true" />
        <div className="orb orb-two" aria-hidden="true" />
        <div className="moon" aria-hidden="true">
          <i className="moon-crater crater-one" />
          <i className="moon-crater crater-two" />
          <i className="moon-crater crater-three" />
        </div>
        </section>

        <section className="about section" id="about">
        <p className="section-label">ABOUT / 关于</p>
        <div className="about-grid">
          <h2>喜欢简单的界面，<br />也喜欢复杂的问题。</h2>
          <div className="about-copy">
            <p>
              我在互联网里写写代码、整理知识，也观察那些被忽略的细节。
              这个站点是一间持续布置的小房间，不定期更新。
            </p>
            <p className="aside">目前状态：探索中，偶尔发呆。</p>
          </div>
        </div>
        </section>

        <section className="section" id="notes">
        <div className="section-heading">
          <p className="section-label">NOTES / 片段</p>
          <p>一些反复想起的事</p>
        </div>
        <div className="note-grid">
          {notes.map((note) => (
            <article className="note-card" key={note.number}>
              <span>{note.number}</span>
              <h3>{note.title}</h3>
              <p>{note.text}</p>
            </article>
          ))}
        </div>
        </section>

        <section className="contact section">
        <p className="section-label">SAY HELLO / 打个招呼</p>
        <h2>如果你也在创造什么，<br />很高兴认识你。</h2>
        <a className="contact-link" href="https://github.com/skynamecat" target="_blank" rel="noreferrer">
          在 GitHub 找到我 <span aria-hidden="true">↗</span>
        </a>
        </section>

        <footer>
          <p>© {new Date().getFullYear()} skynamecat</p>
          <p>安静生长，保持浪漫。</p>
        </footer>
      </div>

      <section className="minimal-home" aria-label="skynamecat 极简主页">
        <div className="minimal-top-space" aria-hidden="true" />
        <div className="minimal-identity">
          <h1>skynamecat</h1>
          <p>DEVELOPER · BUILDER · EXPLORER</p>
          <span>互联网与 AI 产品探索者</span>
        </div>
        <div className="minimal-mark" aria-hidden="true">°</div>
        <div className="minimal-dialogue" aria-live="polite">
          <article className="minimal-message is-lead">
            <span>01</span>
            <p>你好，我是 skynamecat。</p>
          </article>
          <article className="minimal-message">
            <span>02</span>
            <p>我在互联网里写代码、整理知识，也把偶尔冒出来的灵感做成小东西。</p>
          </article>
          <article className="minimal-message">
            <span>03</span>
            <p>这里是我的数字角落。慢慢看，随便坐。</p>
          </article>
          <a className="minimal-github" href="https://github.com/skynamecat" target="_blank" rel="noreferrer">
            GitHub / 看看我做过的东西 <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="minimal-dock" aria-label="介绍状态">
          <span>庞菠菠正在介绍 skynamecat…</span>
          <button type="button" disabled aria-label="介绍播放中">↑</button>
        </div>
      </section>

      <MusicControl />
      <PangboboLoader />
    </main>
  );
}
