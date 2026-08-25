import type { Metadata } from "next";
import { BlindboxClient } from "./blindbox-client";
import "./blindbox.css";

export const metadata: Metadata = {
  title: "庞菠菠今日盲盒 — skynamecat",
  description: "拆开一只庞菠菠，把散步、发呆、听歌和跳舞的瞬间收入图鉴。",
  openGraph: {
    title: "庞菠菠今日盲盒",
    description: "把一个普通瞬间装进小盒子。",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "庞菠菠今日盲盒",
    description: "把一个普通瞬间装进小盒子。",
    images: [],
  },
};

export default function BlindboxPage() {
  return <BlindboxClient />;
}
