import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../out/", import.meta.url);

test("exports the homepage as static HTML", async () => {
  const html = await readFile(new URL("index.html", outputRoot), "utf8");

  assert.match(html, /<title>skynamecat — 数字世界里的安静角落<\/title>/);
  assert.match(html, /在数字世界里/);
  assert.match(html, /安静的地方/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
  await access(new URL("og.png", outputRoot));
});

test("exports the custom 404 page", async () => {
  const html = await readFile(new URL("404.html", outputRoot), "utf8");

  assert.match(html, /404/);
  assert.match(html, /也许页面搬走了/);
  assert.match(html, /回到安静的地方/);
  assert.doesNotMatch(html, /这里暂时没有留下足迹/);
});

test("exports the blindbox as a lightweight static entry", async () => {
  const html = await readFile(new URL("blindbox/index.html", outputRoot), "utf8");

  assert.match(html, /庞菠菠今日盲盒/);
  assert.match(html, /3D 模型会在开启后按设备性能加载/);
  assert.doesNotMatch(html, /pangbobo-actions-balanced\.glb/);
  await access(new URL("pangbobo/pangbobo-actions-lite.glb", outputRoot));
  await access(new URL("pangbobo/pangbobo-hiphop.glb", outputRoot));
});
