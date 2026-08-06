"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

type PetMode = "walking" | "phone" | "music" | "rest" | "laptop";
type Direction = "left" | "right";

const labels: Record<PetMode, string> = {
  walking: "散步中",
  phone: "玩会儿手机",
  music: "戴着耳机听歌 ♪",
  rest: "休息一下…",
  laptop: "看笔记本中",
};

function randomBetween(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

function buildPangbobo(scene: THREE.Scene) {
  const root = new THREE.Group();
  scene.add(root);

  const skin = new THREE.MeshStandardMaterial({ color: 0xffe4d1, roughness: 0.86 });
  const hair = new THREE.MeshStandardMaterial({ color: 0x30251f, roughness: 0.94 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0x242321, roughness: 0.9 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x8b8983, roughness: 0.98 });
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f0e8, roughness: 0.9 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8aa61, roughness: 0.58, metalness: 0.08 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x191817, roughness: 0.82 });
  const blush = new THREE.MeshStandardMaterial({ color: 0xf3a9a0, transparent: true, opacity: 0.34, roughness: 1 });

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.76, 1.05, 24), shirt);
  torso.position.set(0, 1.78, 0);
  root.add(torso);

  const legGeometry = new THREE.CapsuleGeometry(0.31, 0.72, 7, 12);
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  leftLeg.position.set(-0.34, 0.94, 0);
  rightLeg.position.set(0.34, 0.94, 0);
  leftLeg.add(new THREE.Mesh(legGeometry, pants));
  rightLeg.add(new THREE.Mesh(legGeometry, pants));
  root.add(leftLeg, rightLeg);

  const shoeGeometry = new THREE.SphereGeometry(0.4, 18, 12);
  const leftShoe = new THREE.Mesh(shoeGeometry, white);
  const rightShoe = new THREE.Mesh(shoeGeometry, white);
  leftShoe.scale.set(1, 0.48, 1.2);
  rightShoe.scale.copy(leftShoe.scale);
  leftShoe.position.set(0, -0.54, 0.14);
  rightShoe.position.copy(leftShoe.position);
  leftLeg.add(leftShoe);
  rightLeg.add(rightShoe);

  const armGeometry = new THREE.CapsuleGeometry(0.14, 0.66, 6, 10);
  const leftArm = new THREE.Group();
  const rightArm = new THREE.Group();
  leftArm.position.set(-0.72, 1.96, 0.05);
  rightArm.position.set(0.72, 1.96, 0.05);
  leftArm.rotation.z = -0.12;
  rightArm.rotation.z = 0.12;
  leftArm.add(new THREE.Mesh(armGeometry, skin));
  rightArm.add(new THREE.Mesh(armGeometry, skin));
  root.add(leftArm, rightArm);

  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.96, 30, 22), hair);
  hairBack.scale.set(1.06, 1, 0.7);
  hairBack.position.set(0, 2.95, -0.08);
  root.add(hairBack);

  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.43, 22, 16), hair);
  bun.scale.set(1, 0.86, 0.8);
  bun.position.set(-0.91, 2.94, -0.16);
  root.add(bun);

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.83, 30, 22), skin);
  face.scale.set(1.04, 0.92, 0.64);
  face.position.set(0.08, 2.9, 0.37);
  root.add(face);

  const fringeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), hair);
  fringeLeft.scale.set(1.15, 0.42, 0.26);
  fringeLeft.rotation.z = -0.34;
  fringeLeft.position.set(-0.27, 3.43, 0.72);
  const fringeRight = fringeLeft.clone();
  fringeRight.scale.set(0.72, 0.34, 0.24);
  fringeRight.rotation.z = 0.42;
  fringeRight.position.set(0.45, 3.38, 0.7);
  root.add(fringeLeft, fringeRight);

  const eyeGeometry = new THREE.SphereGeometry(0.09, 16, 12);
  const leftEye = new THREE.Mesh(eyeGeometry, dark);
  const rightEye = new THREE.Mesh(eyeGeometry, dark);
  leftEye.scale.set(0.72, 1.42, 0.38);
  rightEye.scale.copy(leftEye.scale);
  leftEye.position.set(-0.23, 2.91, 0.91);
  rightEye.position.set(0.35, 2.91, 0.91);
  root.add(leftEye, rightEye);

  const blushGeometry = new THREE.SphereGeometry(0.13, 14, 10);
  const leftBlush = new THREE.Mesh(blushGeometry, blush);
  const rightBlush = new THREE.Mesh(blushGeometry, blush);
  leftBlush.scale.set(1.55, 0.48, 0.22);
  rightBlush.scale.copy(leftBlush.scale);
  leftBlush.position.set(-0.52, 2.68, 0.87);
  rightBlush.position.set(0.63, 2.68, 0.87);
  root.add(leftBlush, rightBlush);

  const phone = new THREE.Group();
  const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.6, 0.08), gold);
  phoneBody.position.set(0.7, 2.25, 0.7);
  phoneBody.rotation.z = -0.08;
  phone.add(phoneBody);
  for (const [x, y] of [[0.62, 2.43], [0.76, 2.43], [0.69, 2.3]]) {
    const camera = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), dark);
    camera.position.set(x, y, 0.75);
    phone.add(camera);
  }
  root.add(phone);

  const headphones = new THREE.Group();
  const headband = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.07, 10, 36, Math.PI), gold);
  headband.position.set(0.05, 3.05, 0.69);
  const leftCup = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.13, 20), gold);
  const rightCup = leftCup.clone();
  leftCup.rotation.x = Math.PI / 2;
  rightCup.rotation.x = Math.PI / 2;
  leftCup.position.set(-0.69, 2.93, 0.72);
  rightCup.position.set(0.79, 2.93, 0.72);
  headphones.add(headband, leftCup, rightCup);
  root.add(headphones);

  const laptop = new THREE.Group();
  const screen = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.74, 0.09), gold);
  screen.position.set(0, 1.35, 0.77);
  screen.rotation.x = -0.05;
  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.62), gold);
  keyboard.position.set(0, 1.02, 0.53);
  keyboard.rotation.x = -0.18;
  laptop.add(screen, keyboard);
  root.add(laptop);

  return { root, leftLeg, rightLeg, leftArm, rightArm, leftEye, rightEye, phone, headphones, laptop };
}

export function PangboboPet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<PetMode>("phone");
  const [direction, setDirection] = useState<Direction>("right");
  const [position, setPosition] = useState(24);
  const [travelTime, setTravelTime] = useState(0);
  const modeRef = useRef<PetMode>(mode);
  const positionRef = useRef(position);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const musicPlayingRef = useRef(false);
  const scrollingRef = useRef(false);

  useEffect(() => { modeRef.current = mode; }, [mode]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const beginWalk = useCallback(() => {
    if (musicPlayingRef.current || scrollingRef.current) return;
    clearTimer();
    const maxX = Math.max(24, window.innerWidth - 310);
    let destination = randomBetween(24, maxX);
    if (Math.abs(destination - positionRef.current) < 140) {
      destination = positionRef.current < maxX / 2 ? maxX : 24;
    }
    const distance = Math.abs(destination - positionRef.current);
    const duration = Math.max(1900, Math.round((distance / 48) * 1000));
    setDirection(destination >= positionRef.current ? "right" : "left");
    setMode("walking");
    setTravelTime(duration);
    requestAnimationFrame(() => {
      positionRef.current = destination;
      setPosition(destination);
    });
    timerRef.current = setTimeout(() => {
      setTravelTime(0);
      setMode(Math.random() > 0.42 ? "phone" : "rest");
    }, duration);
  }, [clearTimer]);

  useEffect(() => {
    if (mode !== "phone" && mode !== "rest") return;
    clearTimer();
    timerRef.current = setTimeout(beginWalk, randomBetween(4200, 7600));
    return clearTimer;
  }, [beginWalk, clearTimer, mode]);

  useEffect(() => {
    function handleMusic(event: Event) {
      const playing = (event as CustomEvent<{ playing: boolean }>).detail.playing;
      musicPlayingRef.current = playing;
      clearTimer();
      if (scrollingRef.current) return;
      setTravelTime(0);
      setMode(playing ? "music" : "phone");
    }

    function handleScroll() {
      scrollingRef.current = true;
      clearTimer();
      setTravelTime(0);
      setMode("laptop");
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        scrollingRef.current = false;
        setMode(musicPlayingRef.current ? "music" : "phone");
      }, 900);
    }

    function handleResize() {
      const next = Math.min(positionRef.current, Math.max(24, window.innerWidth - 310));
      positionRef.current = next;
      setPosition(next);
    }

    window.addEventListener("pangbobo:music", handleMusic);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimer();
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      window.removeEventListener("pangbobo:music", handleMusic);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [clearTimer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(170, 210, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1.75, 1.75, 4.25, 0, 0.1, 100);
    camera.position.set(0, 2.1, 8);
    camera.lookAt(0, 2.1, 0);
    scene.add(new THREE.HemisphereLight(0xfff5e8, 0x5e645f, 2.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.8);
    key.position.set(-3, 5, 7);
    scene.add(key);

    const model = buildPangbobo(scene);
    const clock = new THREE.Clock();
    let animationFrame = 0;

    function render() {
      const time = clock.getElapsedTime();
      const current = modeRef.current;
      const walking = current === "walking";
      const resting = current === "rest";
      const listening = current === "music";
      const working = current === "laptop";

      model.phone.visible = current === "phone";
      model.headphones.visible = listening;
      model.laptop.visible = working;
      model.root.rotation.y = direction === "left" ? 0.2 : -0.2;
      model.root.rotation.z = listening ? Math.sin(time * 3.1) * 0.055 : resting ? -0.08 : 0;
      model.root.position.y = working ? -0.34 : walking ? Math.abs(Math.sin(time * 7)) * 0.055 : 0;
      model.root.scale.y = resting ? 0.96 : 1;

      model.leftLeg.rotation.z = working ? 1.05 : walking ? Math.sin(time * 7) * 0.17 : 0;
      model.rightLeg.rotation.z = working ? -1.05 : walking ? -Math.sin(time * 7) * 0.17 : 0;
      model.leftLeg.position.x = working ? -0.48 : -0.34;
      model.rightLeg.position.x = working ? 0.48 : 0.34;
      model.leftArm.rotation.z = working ? -0.72 : listening ? -0.2 : -0.12;
      model.rightArm.rotation.z = working ? 0.72 : listening ? 0.55 + Math.sin(time * 3.1) * 0.05 : 0.12;
      const eyeHeight = resting || listening ? 0.16 : 1.42;
      model.leftEye.scale.y = eyeHeight;
      model.rightEye.scale.y = eyeHeight;

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(animationFrame);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
    };
  }, [direction]);

  function cycleMode() {
    if (scrollingRef.current || musicPlayingRef.current) return;
    if (mode === "phone") setMode("rest");
    else if (mode === "rest") beginWalk();
    else setMode("phone");
  }

  return (
    <aside
      className="pangbobo-pet"
      style={{ transform: `translate3d(${position}px, 0, 0)`, transitionDuration: `${travelTime}ms` }}
      aria-label={`3D 宠物庞菠菠，${labels[mode]}`}
    >
      <button className="pangbobo-stage" type="button" onClick={cycleMode} title="点点庞菠菠">
        <span className="pangbobo-name">庞菠菠 · {labels[mode]}</span>
        <canvas ref={canvasRef} className="pangbobo-canvas" width="340" height="420" aria-hidden="true" />
        {mode === "music" && <span className="pangbobo-notes" aria-hidden="true">♪ ♫</span>}
        {mode === "rest" && <span className="pangbobo-sleep" aria-hidden="true">z Z</span>}
      </button>
    </aside>
  );
}
