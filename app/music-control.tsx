"use client";

import { useEffect, useRef, useState } from "react";

const progression = [
  [261.63, 329.63, 392],
  [220, 261.63, 329.63],
  [174.61, 220, 261.63],
  [196, 246.94, 329.63],
];

export function MusicControl() {
  const [playing, setPlaying] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(0);

  useEffect(() => () => stopMusic(), []);

  function playChord() {
    const context = contextRef.current;
    const master = gainRef.current;
    if (!context || !master) return;

    const now = context.currentTime;
    const chord = progression[stepRef.current % progression.length];
    chord.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency / (index === 0 ? 2 : 1);
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(index === 0 ? 0.09 : 0.035, now + 0.8);
      envelope.gain.exponentialRampToValueAtTime(0.001, now + 4.8);
      oscillator.connect(envelope).connect(master);
      oscillator.start(now);
      oscillator.stop(now + 5);
    });
    stepRef.current += 1;
  }

  async function startMusic() {
    const AudioContextClass = window.AudioContext;
    const context = contextRef.current ?? new AudioContextClass();
    const master = gainRef.current ?? context.createGain();
    master.gain.value = 0.24;
    if (!gainRef.current) master.connect(context.destination);
    contextRef.current = context;
    gainRef.current = master;
    await context.resume();
    playChord();
    timerRef.current = setInterval(playChord, 4200);
    setPlaying(true);
    window.dispatchEvent(new CustomEvent("pangbobo:music", { detail: { playing: true } }));
  }

  function stopMusic() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    gainRef.current?.gain.setTargetAtTime(0, contextRef.current?.currentTime ?? 0, 0.12);
    contextRef.current?.close();
    contextRef.current = null;
    gainRef.current = null;
    setPlaying(false);
    window.dispatchEvent(new CustomEvent("pangbobo:music", { detail: { playing: false } }));
  }

  function toggleMusic() {
    if (playing) stopMusic();
    else void startMusic();
  }

  return (
    <button
      className={`music-control${playing ? " is-playing" : ""}`}
      type="button"
      onClick={toggleMusic}
      aria-pressed={playing}
      aria-label={playing ? "暂停背景音乐" : "播放背景音乐"}
      title={playing ? "暂停氛围音乐" : "播放氛围音乐"}
    >
      <span className="music-bars" aria-hidden="true"><i /><i /><i /></span>
      <span>{playing ? "正在播放" : "一点音乐"}</span>
    </button>
  );
}
