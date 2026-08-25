"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type PetMode = "walking" | "phone" | "drink" | "cake" | "music" | "rest" | "laptop" | "wave" | "stretch" | "look" | "happy";
type Direction = "left" | "right";
type ModelQuality = "balanced" | "lite";

type NetworkInformation = {
  downlink?: number;
  effectiveType?: string;
  saveData?: boolean;
};

function chooseModelQuality(): ModelQuality {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const slowConnection = connection?.saveData
    || ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "")
    || (connection?.downlink !== undefined && connection.downlink <= 2);
  const modestDevice = (memory !== undefined && memory <= 4)
    || navigator.hardwareConcurrency <= 4
    || window.matchMedia("(max-width: 720px)").matches;

  return slowConnection || modestDevice ? "lite" : "balanced";
}

const labels: Record<PetMode, string> = {
  walking: "散步中",
  phone: "玩会儿手机",
  drink: "喝奶茶中",
  cake: "吃小蛋糕中",
  music: "戴着耳机听歌 ♪",
  rest: "休息一下…",
  laptop: "看笔记本中",
  wave: "和你打招呼",
  stretch: "伸个懒腰",
  look: "四处看看",
  happy: "心情不错 ♪",
};

const ambientModes: PetMode[] = ["phone", "drink", "cake", "rest", "wave", "stretch", "look", "happy"];
const actionMenuModes: Array<{ mode: PetMode; label: string; symbol: string }> = [
  { mode: "walking", label: "散步", symbol: "↔" },
  { mode: "phone", label: "玩手机", symbol: "▣" },
  { mode: "drink", label: "喝奶茶", symbol: "◌" },
  { mode: "cake", label: "吃小蛋糕", symbol: "△" },
  { mode: "laptop", label: "看电脑", symbol: "⌨" },
  { mode: "rest", label: "休息", symbol: "◡" },
  { mode: "wave", label: "打招呼", symbol: "◇" },
  { mode: "stretch", label: "伸懒腰", symbol: "↥" },
  { mode: "look", label: "四处看看", symbol: "◉" },
  { mode: "happy", label: "开心一下", symbol: "✦" },
];

function randomAmbientMode() {
  return ambientModes[Math.floor(Math.random() * ambientModes.length)];
}

function randomBetween(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

function buildPangbobo(scene: THREE.Scene) {
  const root = new THREE.Group();
  scene.add(root);

  function crayonMaterial(color: string, roughness = 0.94) {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = color;
      context.fillRect(0, 0, 64, 64);
      for (let index = 0; index < 440; index += 1) {
        const light = Math.random() > 0.52;
        context.fillStyle = light ? "rgba(255,255,255,.045)" : "rgba(73,50,35,.055)";
        const size = Math.random() * 1.5 + 0.25;
        context.fillRect(Math.random() * 64, Math.random() * 64, size, size);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.4, 2.4);
    texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: texture, roughness, metalness: 0 });
  }

  const skin = crayonMaterial("#ffe5d3", 0.92);
  const hair = crayonMaterial("#302620", 0.98);
  const shirt = crayonMaterial("#282624", 0.98);
  const pants = crayonMaterial("#918f89", 1);
  const white = crayonMaterial("#f4f0e8", 0.98);
  const gold = crayonMaterial("#ddb469", 0.76);
  const dark = new THREE.MeshStandardMaterial({ color: 0x211c19, roughness: 1 });
  const blush = new THREE.MeshStandardMaterial({ color: 0xf3a9a0, transparent: true, opacity: 0.34, roughness: 1 });
  const outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x6e5748, side: THREE.BackSide, transparent: true, opacity: 0.72 });

  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.68, 24, 16), skin);
  shoulders.scale.set(1.05, 0.34, 0.62);
  shoulders.position.set(0, 2.18, 0.08);
  root.add(shoulders);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.79, 0.96, 24), shirt);
  torso.position.set(0, 1.72, 0.02);
  root.add(torso);

  const strapGeometry = new THREE.CapsuleGeometry(0.035, 0.25, 4, 8);
  const leftStrap = new THREE.Mesh(strapGeometry, shirt);
  const rightStrap = new THREE.Mesh(strapGeometry, shirt);
  leftStrap.position.set(-0.33, 2.3, 0.48);
  rightStrap.position.set(0.33, 2.3, 0.48);
  root.add(leftStrap, rightStrap);

  const legGeometry = new THREE.CapsuleGeometry(0.31, 0.72, 7, 12);
  const leftLeg = new THREE.Group();
  const rightLeg = new THREE.Group();
  leftLeg.position.set(-0.37, 0.9, 0);
  rightLeg.position.set(0.37, 0.9, 0);
  const leftPants = new THREE.Mesh(legGeometry, pants);
  const rightPants = new THREE.Mesh(legGeometry, pants);
  leftPants.scale.x = 1.14;
  rightPants.scale.x = 1.14;
  leftLeg.add(leftPants);
  rightLeg.add(rightPants);
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

  const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.98, 30, 22), hair);
  hairBack.scale.set(1.2, 0.98, 0.69);
  hairBack.position.set(-0.03, 3.02, -0.08);
  root.add(hairBack);

  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.43, 22, 16), hair);
  bun.scale.set(1, 0.86, 0.8);
  bun.position.set(-1.02, 2.91, -0.14);
  root.add(bun);

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.86, 30, 22), skin);
  face.scale.set(1.18, 0.8, 0.6);
  face.position.set(0.1, 2.92, 0.39);
  root.add(face);

  const fringeLeft = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), hair);
  fringeLeft.scale.set(1.28, 0.29, 0.23);
  fringeLeft.rotation.z = -0.25;
  fringeLeft.position.set(-0.28, 3.48, 0.7);
  const fringeRight = fringeLeft.clone();
  fringeRight.scale.set(0.66, 0.25, 0.21);
  fringeRight.rotation.z = 0.42;
  fringeRight.position.set(0.53, 3.4, 0.7);
  root.add(fringeLeft, fringeRight);

  const eyeGeometry = new THREE.SphereGeometry(0.075, 16, 12);
  const leftEye = new THREE.Mesh(eyeGeometry, dark);
  const rightEye = new THREE.Mesh(eyeGeometry, dark);
  leftEye.scale.set(0.64, 1.58, 0.34);
  rightEye.scale.copy(leftEye.scale);
  leftEye.position.set(-0.22, 2.91, 0.94);
  rightEye.position.set(0.39, 2.91, 0.94);
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
  phoneBody.position.set(0.55, 2.86, 0.94);
  phoneBody.rotation.z = -0.08;
  phone.add(phoneBody);
  for (const [x, y] of [[0.47, 3.04], [0.62, 3.04], [0.55, 2.91]]) {
    const camera = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), dark);
    camera.position.set(x, y, 0.99);
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

  const originalMeshes: THREE.Mesh[] = [];
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) originalMeshes.push(object);
  });
  originalMeshes.forEach((mesh) => {
    const outline = new THREE.Mesh(mesh.geometry, outlineMaterial);
    outline.scale.setScalar(1.045);
    outline.renderOrder = -1;
    mesh.add(outline);
  });

  return { root, leftLeg, rightLeg, leftArm, rightArm, leftEye, rightEye, phone, headphones, laptop };
}

export function PangboboPet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<PetMode>("phone");
  const [isListening, setIsListening] = useState(false);
  const [direction, setDirection] = useState<Direction>("right");
  const [position, setPosition] = useState(24);
  const [lift, setLift] = useState(0);
  const [travelTime, setTravelTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAlignRight, setMenuAlignRight] = useState(false);
  const modeRef = useRef<PetMode>(mode);
  const directionRef = useRef<Direction>(direction);
  const positionRef = useRef(position);
  const liftRef = useRef(lift);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const musicPlayingRef = useRef(false);
  const scrollingRef = useRef(false);
  const suppressClickRef = useRef(false);
  const longPressOpenedRef = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originLift: number;
    originMode: PetMode;
    moved: boolean;
  } | null>(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { directionRef.current = direction; }, [direction]);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const beginWalk = useCallback(() => {
    if (scrollingRef.current || dragRef.current) return;
    clearTimer();
    const maxX = Math.max(24, window.innerWidth - 310);
    let destination = randomBetween(24, maxX);
    if (Math.abs(destination - positionRef.current) < 140) {
      destination = positionRef.current < maxX / 2 ? maxX : 24;
    }
    const distance = Math.abs(destination - positionRef.current);
    const duration = Math.max(2300, Math.round((distance / 37) * 1000));
    setDirection(destination >= positionRef.current ? "right" : "left");
    setMode("walking");
    setTravelTime(duration);
    requestAnimationFrame(() => {
      positionRef.current = destination;
      setPosition(destination);
    });
    timerRef.current = setTimeout(() => {
      setTravelTime(0);
      setMode(randomAmbientMode());
    }, duration);
  }, [clearTimer]);

  useEffect(() => {
    if (menuOpen || !ambientModes.includes(mode)) return;
    clearTimer();
    timerRef.current = setTimeout(beginWalk, randomBetween(8000, 14000));
    return clearTimer;
  }, [beginWalk, clearTimer, menuOpen, mode]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeMenu = (event: globalThis.PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest(".pangbobo-action-menu") && !target?.closest(".pangbobo-stage")) setMenuOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("pointerdown", closeMenu);
    window.addEventListener("keydown", closeWithEscape);
    return () => {
      window.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    function handleMusic(event: Event) {
      const playing = (event as CustomEvent<{ playing: boolean }>).detail.playing;
      musicPlayingRef.current = playing;
      setIsListening(playing);
      if (modeRef.current === "music") setMode("phone");
    }

    function handleScroll() {
      if (dragRef.current) return;
      setMenuOpen(false);
      scrollingRef.current = true;
      clearTimer();
      setTravelTime(0);
      setMode("laptop");
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        scrollingRef.current = false;
        setMode(randomAmbientMode());
      }, 1450);
    }

    function handleResize() {
      const next = Math.min(positionRef.current, Math.max(24, window.innerWidth - 310));
      const nextLift = Math.min(liftRef.current, Math.max(0, window.innerHeight - 220));
      positionRef.current = next;
      liftRef.current = nextLift;
      setPosition(next);
      setLift(nextLift);
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

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const petBounds = event.currentTarget.closest(".pangbobo-pet")?.getBoundingClientRect();
    const currentX = petBounds ? petBounds.left : positionRef.current;
    const currentLift = petBounds ? Math.max(0, window.innerHeight - petBounds.bottom) : liftRef.current;
    event.currentTarget.setPointerCapture(event.pointerId);
    clearTimer();
    setTravelTime(0);
    positionRef.current = currentX;
    liftRef.current = currentLift;
    setPosition(currentX);
    setLift(currentLift);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: currentX,
      originLift: currentLift,
      originMode: modeRef.current,
      moved: false,
    };
    if (event.pointerType !== "mouse") {
      clearLongPress();
      const stage = event.currentTarget;
      const pointerId = event.pointerId;
      longPressTimerRef.current = setTimeout(() => {
        suppressClickRef.current = true;
        longPressOpenedRef.current = true;
        if (stage.hasPointerCapture(pointerId)) stage.releasePointerCapture(pointerId);
        dragRef.current = null;
        setMenuAlignRight(currentX > window.innerWidth / 2);
        setMenuOpen(true);
        setIsDragging(false);
      }, 520);
    }
  }, [clearLongPress, clearTimer]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) > 5) {
      clearLongPress();
      drag.moved = true;
      setIsDragging(true);
      if (!musicPlayingRef.current && !scrollingRef.current) setMode("happy");
    }
    if (!drag.moved) return;
    const nextX = THREE.MathUtils.clamp(drag.originX + deltaX, 0, Math.max(0, window.innerWidth - 170));
    const nextLift = THREE.MathUtils.clamp(drag.originLift - deltaY, 0, Math.max(0, window.innerHeight - 210));
    positionRef.current = nextX;
    liftRef.current = nextLift;
    setPosition(nextX);
    setLift(nextLift);
  }, [clearLongPress]);

  const finishDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    clearLongPress();
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      if (suppressClickRef.current) window.setTimeout(() => { suppressClickRef.current = false; }, 0);
      return;
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setIsDragging(false);
    if (!drag.moved) return;
    suppressClickRef.current = true;
    window.setTimeout(() => { suppressClickRef.current = false; }, 0);
    if (scrollingRef.current) setMode("laptop");
    else setMode("look");
  }, [clearLongPress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderCanvas = canvas;
    const modelQuality = chooseModelQuality();
    canvas.dataset.modelQuality = modelQuality;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, modelQuality === "lite" ? 1.15 : 1.5));
    renderer.setSize(170, 210, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = false;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1.75, 1.75, 4.25, 0, 0.1, 100);
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xfff5e8, 0x5e645f, 2.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.8);
    key.position.set(-3, 5, 7);
    scene.add(key);

    const modelRoot = new THREE.Group();
    scene.add(modelRoot);

    const character = new THREE.Group();
    modelRoot.add(character);
    const loader = new GLTFLoader();
    const bones: Record<string, THREE.Object3D> = {};
    const restBoneRotations = new Map<THREE.Object3D, THREE.Quaternion>();
    const restHeadRootQuaternion = new THREE.Quaternion();
    const inverseRestHeadRootQuaternion = new THREE.Quaternion();
    let hasRestHeadRootQuaternion = false;
    let animationMixer: THREE.AnimationMixer | null = null;
    const animationActions: Record<string, THREE.AnimationAction> = {};
    let activeActionName = "";
    let disposed = false;
    const onModelLoaded = (gltf: Awaited<ReturnType<GLTFLoader["loadAsync"]>>) => {
        if (disposed) return;
        const imported = gltf.scene;
        const sourceBounds = new THREE.Box3().setFromObject(imported);
        const sourceSize = sourceBounds.getSize(new THREE.Vector3());
        const scale = 3.72 / Math.max(sourceSize.y, 0.001);
        imported.scale.setScalar(scale);
        imported.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(imported);
        const center = bounds.getCenter(new THREE.Vector3());
        imported.position.x -= center.x;
        imported.position.y -= bounds.min.y - 0.12;
        imported.position.z -= center.z;
        imported.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = false;
            object.receiveShadow = false;
          }
          if (object.type === "Bone") {
            bones[object.name] = object;
            restBoneRotations.set(object, object.quaternion.clone());
          }
        });
        character.add(imported);
        modelRoot.updateMatrixWorld(true);
        const headBone = bones.Head;
        if (headBone) {
          const headWorldQuaternion = new THREE.Quaternion();
          const rootWorldQuaternion = new THREE.Quaternion();
          headBone.getWorldQuaternion(headWorldQuaternion);
          modelRoot.getWorldQuaternion(rootWorldQuaternion);
          restHeadRootQuaternion.copy(rootWorldQuaternion.invert().multiply(headWorldQuaternion));
          inverseRestHeadRootQuaternion.copy(restHeadRootQuaternion).invert();
          hasRestHeadRootQuaternion = true;
        }
        if (gltf.animations.length) {
          animationMixer = new THREE.AnimationMixer(imported);
          gltf.animations.forEach((clip) => {
            animationActions[clip.name] = animationMixer!.clipAction(clip);
          });
          canvas.setAttribute("aria-label", `庞菠菠3D画布，已加载${gltf.animations.length}段动画`);
        }
        canvas.dataset.modelLoaded = "true";
      };
    const liteModelUrl = "/pangbobo/pangbobo-actions-lite.glb";
    const preferredModelUrl = modelQuality === "lite"
      ? liteModelUrl
      : "/pangbobo/pangbobo-actions-balanced.glb";
    const markLoadError = () => {
      if (!disposed) canvas.dataset.loadError = "true";
    };
    loader.load(
      preferredModelUrl,
      onModelLoaded,
      undefined,
      modelQuality === "balanced"
        ? () => {
            if (disposed) return;
            canvas.dataset.modelQuality = "lite-fallback";
            loader.load(liteModelUrl, onModelLoaded, undefined, markLoadError);
          }
        : markLoadError,
    );

    const accessoryGold = new THREE.MeshStandardMaterial({ color: 0xd9ad67, roughness: 0.62 });
    const accessoryDark = new THREE.MeshStandardMaterial({ color: 0x302823, roughness: 0.86 });
    const accessoryScreen = new THREE.MeshStandardMaterial({ color: 0x17191d, roughness: 0.58, metalness: 0.08 });
    const accessoryGlow = new THREE.MeshStandardMaterial({ color: 0xb9d8d0, emissive: 0x496761, emissiveIntensity: 0.35, roughness: 0.6 });
    const phone = new THREE.Group();
    const phoneBody = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.56, 0.08, 3, 0.055), accessoryGold);
    const phoneScreen = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.45, 0.012, 3, 0.032), accessoryScreen);
    phoneScreen.position.z = 0.047;
    const phoneGlow = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.3, 0.014, 3, 0.025), accessoryGlow);
    phoneGlow.position.z = 0.056;
    phone.add(phoneBody, phoneScreen, phoneGlow);
    phone.rotation.set(-0.18, Math.PI - 0.24, 0.08);
    modelRoot.add(phone);

    const teaMaterial = new THREE.MeshStandardMaterial({ color: 0xb77848, roughness: 0.72 });
    const cupMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4e6d1,
      transparent: true,
      opacity: 0.5,
      roughness: 0.38,
      depthWrite: false,
    });
    const strawMaterial = new THREE.MeshStandardMaterial({ color: 0xd88686, roughness: 0.68 });
    const pearlMaterial = new THREE.MeshStandardMaterial({ color: 0x39271f, roughness: 0.9 });
    const milkTea = new THREE.Group();
    const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.17, 0.48, 24), teaMaterial);
    tea.position.y = -0.19;
    const cupShell = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.19, 0.54, 24, 1, true), cupMaterial);
    cupShell.position.y = -0.18;
    const cupBottom = new THREE.Mesh(new THREE.CircleGeometry(0.19, 24), cupMaterial);
    cupBottom.rotation.x = -Math.PI / 2;
    cupBottom.position.y = -0.45;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.245, 0.055, 24), cupMaterial);
    lid.position.y = 0.1;
    const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.62, 10), strawMaterial);
    straw.position.set(0.055, 0.38, 0.02);
    straw.rotation.z = -0.08;
    milkTea.add(tea, cupShell, cupBottom, lid, straw);
    for (const [x, y, z] of [
      [-0.1, -0.36, 0.09], [0.02, -0.38, 0.12], [0.11, -0.34, 0.04],
      [-0.04, -0.3, 0.13], [0.08, -0.29, 0.1],
    ] as Array<[number, number, number]>) {
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 8), pearlMaterial);
      pearl.position.set(x, y, z);
      milkTea.add(pearl);
    }
    milkTea.rotation.set(-0.08, 0.18, -0.04);
    modelRoot.add(milkTea);

    const plateMaterial = new THREE.MeshStandardMaterial({ color: 0xf4eee5, roughness: 0.72 });
    const cakeMaterial = new THREE.MeshStandardMaterial({ color: 0xd6a071, roughness: 0.82 });
    const creamMaterial = new THREE.MeshStandardMaterial({ color: 0xfff3e5, roughness: 0.78 });
    const berryMaterial = new THREE.MeshStandardMaterial({ color: 0xc95f64, roughness: 0.72 });
    const forkMaterial = new THREE.MeshStandardMaterial({ color: 0xc9c2b8, roughness: 0.46, metalness: 0.35 });
    const cakePlate = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.045, 28), plateMaterial);
    const cakeBase = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.3, 0.34, 3, 0.045), cakeMaterial);
    cakeBase.position.y = 0.18;
    const lowerCream = new THREE.Mesh(new RoundedBoxGeometry(0.43, 0.055, 0.35, 3, 0.025), creamMaterial);
    lowerCream.position.y = 0.13;
    const topCream = new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.07, 0.36, 3, 0.03), creamMaterial);
    topCream.position.y = 0.35;
    const strawberry = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 10), berryMaterial);
    strawberry.scale.set(1, 0.85, 0.9);
    strawberry.position.set(0.03, 0.46, 0.02);
    cakePlate.add(plate, cakeBase, lowerCream, topCream, strawberry);
    cakePlate.rotation.set(0.05, -0.12, -0.02);
    modelRoot.add(cakePlate);

    const cakeFork = new THREE.Group();
    const forkHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.5, 8), forkMaterial);
    forkHandle.position.y = 0.05;
    const forkHead = new THREE.Mesh(new RoundedBoxGeometry(0.12, 0.12, 0.025, 2, 0.018), forkMaterial);
    forkHead.position.y = 0.35;
    cakeFork.add(forkHandle, forkHead);
    for (const x of [-0.045, -0.015, 0.015, 0.045]) {
      const tine = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.13, 6), forkMaterial);
      tine.position.set(x, 0.46, 0);
      cakeFork.add(tine);
    }
    cakeFork.rotation.set(-0.12, 0.08, -0.14);
    modelRoot.add(cakeFork);

    const headphones = new THREE.Group();
    const frontBandCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.74, 0.1, -0.38),
      new THREE.Vector3(-0.8, 0.54, -0.42),
      new THREE.Vector3(-0.7, 1, -0.46),
      new THREE.Vector3(0, 1.24, -0.5),
      new THREE.Vector3(0.7, 1, -0.46),
      new THREE.Vector3(0.8, 0.54, -0.42),
      new THREE.Vector3(0.74, 0.1, -0.38),
    ]);
    const rightProfileBandCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.74, 0.12, 0.07),
      new THREE.Vector3(-0.88, 0.52, 0),
      new THREE.Vector3(-0.68, 1.06, 0.25),
      new THREE.Vector3(-0.08, 1.24, 0.18),
    );
    const leftProfileBandCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.74, 0.12, 0.07),
      new THREE.Vector3(0.88, 0.52, 0),
      new THREE.Vector3(0.68, 1.06, 0.25),
      new THREE.Vector3(0.08, 1.24, 0.18),
    );
    const frontBand = new THREE.Mesh(new THREE.TubeGeometry(frontBandCurve, 40, 0.055, 8, false), accessoryGold);
    const rightProfileBand = new THREE.Mesh(new THREE.TubeGeometry(rightProfileBandCurve, 32, 0.06, 8, false), accessoryGold);
    const leftProfileBand = new THREE.Mesh(new THREE.TubeGeometry(leftProfileBandCurve, 32, 0.06, 8, false), accessoryGold);
    const leftCup = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.13, 20), accessoryGold);
    const rightCup = leftCup.clone();
    leftCup.rotation.x = Math.PI / 2;
    rightCup.rotation.x = Math.PI / 2;
    leftCup.position.set(-0.6, -0.02, 0.02);
    rightCup.position.set(0.6, -0.02, 0.02);
    const leftPad = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.14, 20), accessoryDark);
    const rightPad = leftPad.clone();
    leftPad.rotation.x = Math.PI / 2;
    rightPad.rotation.x = Math.PI / 2;
    leftPad.position.set(-0.6, -0.02, 0.06);
    rightPad.position.set(0.6, -0.02, 0.06);
    headphones.add(frontBand, rightProfileBand, leftProfileBand, leftCup, rightCup, leftPad, rightPad);
    modelRoot.add(headphones);

    const laptop = new THREE.Group();
    const laptopScreen = new THREE.Mesh(new RoundedBoxGeometry(1.06, 0.66, 0.08, 3, 0.05), accessoryGold);
    laptopScreen.position.set(0, 0.24, 0);
    laptopScreen.rotation.x = -0.32;
    const laptopDisplay = new THREE.Mesh(new RoundedBoxGeometry(0.92, 0.52, 0.014, 3, 0.035), accessoryScreen);
    laptopDisplay.position.set(0, 0.24, -0.05);
    laptopDisplay.rotation.x = -0.32;
    const laptopLogo = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20), accessoryDark);
    laptopLogo.position.set(0, 0.24, 0.05);
    laptopLogo.rotation.x = -0.32;
    const laptopKeyboard = new THREE.Mesh(new RoundedBoxGeometry(1.06, 0.07, 0.58, 3, 0.045), accessoryGold);
    laptopKeyboard.position.set(0, -0.1, 0.29);
    laptopKeyboard.rotation.x = 0.26;
    const keyboardInset = new THREE.Mesh(new RoundedBoxGeometry(0.86, 0.016, 0.36, 2, 0.025), accessoryDark);
    keyboardInset.position.set(0, -0.055, 0.29);
    keyboardInset.rotation.x = 0.26;
    laptop.add(laptopScreen, laptopDisplay, laptopLogo, laptopKeyboard, keyboardInset);
    laptop.rotation.y = -0.14;
    modelRoot.add(laptop);

    const clock = new THREE.Clock();
    let animationFrame = 0;
    let previousTime = 0;
    let phonePresence = 0;
    let drinkPresence = 0;
    let cakePresence = 0;
    let headphonesPresence = 0;
    let laptopPresence = 0;
    const scratchHead = new THREE.Vector3();
    const scratchLeftHand = new THREE.Vector3();
    const scratchRightHand = new THREE.Vector3();
    const rootWorldQuaternion = new THREE.Quaternion();
    const headWorldQuaternion = new THREE.Quaternion();
    const currentHeadRootQuaternion = new THREE.Quaternion();
    const headDeltaQuaternion = new THREE.Quaternion();
    const headphonesOffset = new THREE.Vector3(0, 0.4, 0.06);
    const phoneOffset = new THREE.Vector3(0.03, 0.03, 0.34);
    const milkTeaOffset = new THREE.Vector3(0.12, -0.05, 0.34);
    const cakePlateOffset = new THREE.Vector3(-0.22, 0.08, 0.34);
    const cakeForkOffset = new THREE.Vector3(0.04, 0.02, 0.28);
    const laptopOffset = new THREE.Vector3(0, 0.08, 0.32);

    const bonePositionInRoot = (name: string, target: THREE.Vector3) => {
      const bone = bones[name];
      if (!bone) return false;
      bone.getWorldPosition(target);
      modelRoot.worldToLocal(target);
      return true;
    };

    const boneOffset = (name: string, x = 0, y = 0, z = 0) => {
      const bone = bones[name];
      const rest = bone && restBoneRotations.get(bone);
      if (!bone || !rest) return;
      bone.quaternion.copy(rest).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)));
    };

    function render() {
      const time = clock.getElapsedTime();
      const delta = Math.min(time - previousTime, 0.05);
      previousTime = time;
      const current = modeRef.current;
      const walking = current === "walking";
      const resting = current === "rest";
      const listening = renderCanvas.dataset.listening === "true";
      const working = current === "laptop";
      const celebrating = current === "happy";

      phonePresence = THREE.MathUtils.damp(phonePresence, current === "phone" ? 1 : 0, 7, delta);
      drinkPresence = THREE.MathUtils.damp(drinkPresence, current === "drink" ? 1 : 0, 7, delta);
      cakePresence = THREE.MathUtils.damp(cakePresence, current === "cake" ? 1 : 0, 7, delta);
      headphonesPresence = THREE.MathUtils.damp(headphonesPresence, listening ? 1 : 0, 6, delta);
      laptopPresence = THREE.MathUtils.damp(laptopPresence, working ? 1 : 0, 6, delta);
      phone.visible = phonePresence > 0.015;
      milkTea.visible = drinkPresence > 0.015;
      cakePlate.visible = cakePresence > 0.015;
      cakeFork.visible = cakePresence > 0.015;
      headphones.visible = headphonesPresence > 0.015;
      laptop.visible = laptopPresence > 0.015;
      phone.scale.setScalar(phonePresence);
      milkTea.scale.setScalar(drinkPresence);
      cakePlate.scale.setScalar(cakePresence);
      cakeFork.scale.setScalar(cakePresence);
      headphones.scale.setScalar(headphonesPresence);
      laptop.scale.setScalar(laptopPresence);
      phone.rotation.z = 0.08 + Math.sin(time * 1.8) * 0.008 * phonePresence;
      milkTea.rotation.z = -0.04 + Math.sin(time * 1.4) * 0.008 * drinkPresence;
      cakePlate.rotation.z = -0.02 + Math.sin(time * 1.1) * 0.006 * cakePresence;
      cakeFork.rotation.z = -0.14 + Math.sin(time * 2.2) * 0.025 * cakePresence;
      laptop.rotation.z = Math.sin(time * 1.3) * 0.006 * laptopPresence;
      const targetYaw = walking ? (directionRef.current === "left" ? -1.12 : 1.12) : 0;
      modelRoot.rotation.y = THREE.MathUtils.damp(modelRoot.rotation.y, targetYaw, walking ? 9 : 7, delta);
      const profileFactor = THREE.MathUtils.clamp(Math.abs(modelRoot.rotation.y) / 1.05, 0, 1);
      const cupDepth = THREE.MathUtils.lerp(-0.32, 0.05, profileFactor);
      const cupSpread = 0.74;
      const cupHeight = 0.12;
      leftCup.position.x = -cupSpread;
      rightCup.position.x = cupSpread;
      leftCup.position.y = cupHeight;
      rightCup.position.y = cupHeight;
      leftPad.position.x = -cupSpread - 0.08;
      rightPad.position.x = cupSpread + 0.08;
      leftPad.position.y = cupHeight;
      rightPad.position.y = cupHeight;
      leftCup.position.z = 0.02 + cupDepth;
      rightCup.position.z = 0.02 + cupDepth;
      leftPad.position.z = 0.02 + cupDepth;
      rightPad.position.z = 0.02 + cupDepth;
      const isProfile = profileFactor > 0.62;
      frontBand.visible = !isProfile;
      rightProfileBand.visible = isProfile && modelRoot.rotation.y > 0;
      leftProfileBand.visible = isProfile && modelRoot.rotation.y < 0;
      leftCup.visible = !isProfile || modelRoot.rotation.y > 0;
      leftPad.visible = leftCup.visible;
      rightCup.visible = !isProfile || modelRoot.rotation.y < 0;
      rightPad.visible = rightCup.visible;
      const profileCupScale = THREE.MathUtils.lerp(1, 1.2, profileFactor);
      const cupVerticalScale = THREE.MathUtils.lerp(0.78, 1.2, profileFactor);
      leftCup.rotation.set(0, 0, Math.PI / 2);
      rightCup.rotation.set(0, 0, Math.PI / 2);
      leftPad.rotation.set(0, 0, Math.PI / 2);
      rightPad.rotation.set(0, 0, Math.PI / 2);
      leftCup.scale.set(cupVerticalScale, profileCupScale, profileCupScale);
      rightCup.scale.set(cupVerticalScale, profileCupScale, profileCupScale);
      leftPad.scale.set(cupVerticalScale, profileCupScale, profileCupScale);
      rightPad.scale.set(cupVerticalScale, profileCupScale, profileCupScale);
      modelRoot.rotation.z = THREE.MathUtils.damp(
        modelRoot.rotation.z,
        listening ? Math.sin(time * 3.1) * 0.018 : resting ? -0.025 : 0,
        8,
        delta,
      );
      modelRoot.position.y = walking
        ? Math.abs(Math.sin(time * 7.4)) * 0.025
        : working
          ? -0.035
          : celebrating
            ? Math.abs(Math.sin(time * 4.8)) * 0.035
            : listening
              ? Math.sin(time * 3.15) * 0.016
              : 0;
      character.rotation.x = THREE.MathUtils.damp(character.rotation.x, working ? -0.035 : 0, 8, delta);
      character.scale.y = THREE.MathUtils.damp(character.scale.y, 1, 8, delta);

      const desiredActionName = walking
        ? "Walk"
        : resting
          ? "Rest"
          : working
            ? "Laptop"
            : current === "phone"
              ? "Phone"
              : current === "drink"
                ? "Drink"
                : current === "cake"
                  ? "EatCake"
              : current === "wave"
                ? "Wave"
                : current === "stretch"
                  ? "Stretch"
                  : current === "look"
                    ? "Look"
                    : current === "happy"
                      ? "Happy"
                      : "Idle";
      if (animationMixer && animationActions[desiredActionName]) {
        if (activeActionName !== desiredActionName) {
          if (activeActionName) animationActions[activeActionName]?.fadeOut(0.52);
          const nextAction = animationActions[desiredActionName].reset().fadeIn(0.52).play();
          nextAction.timeScale = desiredActionName === "Walk" ? 0.88 : 1;
          activeActionName = desiredActionName;
        }
        animationMixer.update(delta);
      } else {
        restBoneRotations.forEach((rotation, bone) => bone.quaternion.copy(rotation));
        if (listening) {
          boneOffset("Head", 0, 0, Math.sin(time * 3.1) * 0.08);
        } else if (working) {
          boneOffset("Spine1", 0.08, 0, 0);
        } else if (current === "phone") {
          boneOffset("Head", 0.08, 0, -0.04);
        } else if (current === "drink") {
          boneOffset("Head", 0.04, -0.02, 0);
        } else if (current === "cake") {
          boneOffset("Head", 0.04, 0.02, 0);
        } else if (resting) {
          boneOffset("Head", 0, 0, -0.08);
        }
      }

      character.updateMatrixWorld(true);
      const hasHead = bonePositionInRoot("Head", scratchHead);
      if (hasHead) {
        headphones.position.copy(scratchHead).add(headphonesOffset);
        if (hasRestHeadRootQuaternion) {
          bones.Head.getWorldQuaternion(headWorldQuaternion);
          modelRoot.getWorldQuaternion(rootWorldQuaternion);
          currentHeadRootQuaternion.copy(rootWorldQuaternion).invert().multiply(headWorldQuaternion);
          headDeltaQuaternion.copy(currentHeadRootQuaternion).multiply(inverseRestHeadRootQuaternion);
          headphones.quaternion.copy(headDeltaQuaternion);
        } else {
          headphones.quaternion.identity();
        }
      }
      if (bonePositionInRoot("RightHand", scratchRightHand)) {
        phone.position.copy(scratchRightHand);
        phone.position.add(phoneOffset);
        milkTea.position.copy(scratchRightHand);
        milkTea.position.add(milkTeaOffset);
        cakeFork.position.copy(scratchRightHand);
        cakeFork.position.add(cakeForkOffset);
      }
      if (bonePositionInRoot("LeftHand", scratchLeftHand)) {
        cakePlate.position.copy(scratchLeftHand);
        cakePlate.position.add(cakePlateOffset);
      }
      if (
        bonePositionInRoot("LeftHand", scratchLeftHand)
        && bonePositionInRoot("RightHand", scratchRightHand)
      ) {
        laptop.position.copy(scratchLeftHand).lerp(scratchRightHand, 0.5).add(laptopOffset);
      }

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    }
    render();

    return () => {
      disposed = true;
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
  }, []);

  function cycleMode() {
    if (longPressOpenedRef.current) {
      longPressOpenedRef.current = false;
      suppressClickRef.current = false;
      return;
    }
    if (suppressClickRef.current) return;
    if (scrollingRef.current) return;
    clearTimer();
    const cycle: PetMode[] = ["phone", "drink", "cake", "wave", "stretch", "look", "happy", "rest"];
    const index = cycle.indexOf(mode);
    if (index === cycle.length - 1) beginWalk();
    else setMode(cycle[index >= 0 ? index + 1 : 0]);
  }

  function openActionMenu(event: ReactMouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    clearTimer();
    clearLongPress();
    const petBounds = event.currentTarget.closest(".pangbobo-pet")?.getBoundingClientRect();
    if (petBounds) {
      const currentX = petBounds.left;
      const currentLift = Math.max(0, window.innerHeight - petBounds.bottom);
      positionRef.current = currentX;
      liftRef.current = currentLift;
      setPosition(currentX);
      setLift(currentLift);
    }
    setTravelTime(0);
    setMenuAlignRight((petBounds?.left ?? positionRef.current) > window.innerWidth / 2);
    setMenuOpen(true);
  }

  function chooseBaseAction(nextMode: PetMode) {
    clearTimer();
    scrollingRef.current = false;
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    setTravelTime(0);
    if (nextMode === "walking") beginWalk();
    else setMode(nextMode);
  }

  function toggleListening() {
    window.dispatchEvent(new CustomEvent("pangbobo:music-request", { detail: { playing: !isListening } }));
  }

  return (
    <aside
      className={`pangbobo-pet${isDragging ? " is-dragging" : ""}`}
      style={{ transform: `translate3d(${position}px, ${-lift}px, 0)`, transitionDuration: `${isDragging ? 0 : travelTime}ms` }}
      aria-label={`3D 宠物庞菠菠，${labels[mode]}${isListening ? "，听歌中" : ""}`}
    >
      <button
        className="pangbobo-stage"
        type="button"
        onClick={cycleMode}
        onContextMenu={openActionMenu}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        title="点一下切换动作，按住拖动，右键打开动作列表"
      >
        <span className="pangbobo-name">
          庞菠菠 · {isDragging ? "跟你走" : `${labels[mode]}${isListening ? " · 听歌中" : ""}`}
        </span>
        <canvas
          ref={canvasRef}
          className="pangbobo-canvas"
          width="340"
          height="420"
          data-listening={isListening ? "true" : "false"}
          aria-hidden="true"
        />
        {isListening && <span className="pangbobo-notes" aria-hidden="true">♪ ♫</span>}
        {mode === "rest" && <span className="pangbobo-sleep" aria-hidden="true">z Z</span>}
      </button>
      {menuOpen && (
        <div
          className={`pangbobo-action-menu${menuAlignRight ? " align-right" : ""}`}
          role="menu"
          aria-label="庞菠菠动作列表"
        >
          <div className="pangbobo-menu-heading">
            <span>选择动作</span>
            <small>基础动作单选</small>
          </div>
          <div className="pangbobo-menu-grid">
            {actionMenuModes.map((item) => (
              <button
                key={item.mode}
                type="button"
                role="menuitemradio"
                aria-checked={mode === item.mode}
                className={mode === item.mode ? "is-selected" : ""}
                onClick={() => chooseBaseAction(item.mode)}
              >
                <span aria-hidden="true">{item.symbol}</span>
                {item.label}
              </button>
            ))}
          </div>
          <div className="pangbobo-menu-divider" />
          <button
            className={`pangbobo-overlay-action${isListening ? " is-selected" : ""}`}
            type="button"
            role="menuitemcheckbox"
            aria-checked={isListening}
            onClick={toggleListening}
          >
            <span className="pangbobo-menu-check" aria-hidden="true">{isListening ? "✓" : "+"}</span>
            <span><strong>听歌</strong><small>可与以上动作同时进行</small></span>
          </button>
        </div>
      )}
    </aside>
  );
}
