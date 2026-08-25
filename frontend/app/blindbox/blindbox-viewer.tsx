"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type ViewerProps = {
  seriesCode: string;
  animationClip: string;
  variantName: string;
  modelAssetKey?: string;
};

type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
};

function chooseModel(seriesCode: string, modelAssetKey?: string) {
  if (modelAssetKey) return `/api/public/blindbox/assets/${encodeURIComponent(modelAssetKey)}`;
  if (seriesCode === "hiphop") return "/pangbobo/pangbobo-hiphop.glb";
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const constrained = connection?.saveData
    || ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "")
    || (connection?.downlink !== undefined && connection.downlink < 2.5)
    || (memory !== undefined && memory <= 4)
    || navigator.hardwareConcurrency <= 4;
  return constrained
    ? "/pangbobo/pangbobo-actions-lite.glb"
    : "/pangbobo/pangbobo-actions-balanced.glb";
}

export function BlindboxViewer({ seriesCode, animationClip, variantName, modelAssetKey }: ViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState("正在唤醒庞菠菠…");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let frame = 0;
    let mixer: THREE.AnimationMixer | null = null;
    let model: THREE.Object3D | null = null;
    let dragging = false;
    let pointerX = 0;
    let desiredRotation = 0;
    const webglProbe = document.createElement("canvas");
    if (!webglProbe.getContext("webgl2") && !webglProbe.getContext("webgl")) {
      window.setTimeout(() => setStatus("当前浏览器不支持 3D，卡片仍可正常收藏"), 0);
      return;
    }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.1, 6.7);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = "blindbox-model-canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff6e5, 0x725b65, 2.8));
    const keyLight = new THREE.DirectionalLight(0xffdfad, 4.2);
    keyLight.position.set(3, 5, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xff8f73, 2.1);
    rimLight.position.set(-4, 2, -3);
    scene.add(rimLight);

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      pointerX = event.clientX;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      desiredRotation += (event.clientX - pointerX) * 0.012;
      pointerX = event.clientX;
    };
    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);

    const clock = new THREE.Clock();
    const render = () => {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      if (model) {
        if (!dragging) desiredRotation += delta * 0.14;
        model.rotation.y = THREE.MathUtils.damp(model.rotation.y, desiredRotation, 8, delta);
      }
      mixer?.update(delta);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    render();

    const loader = new GLTFLoader();
    const preferredUrl = chooseModel(seriesCode, modelAssetKey);
    const bundledUrl = chooseModel(seriesCode);
    const modelUrls = preferredUrl === bundledUrl ? [preferredUrl] : [preferredUrl, bundledUrl];
    const loadModel = (urlIndex: number): void => {
      loader.load(
        modelUrls[urlIndex],
        (gltf) => {
          if (disposed) return;
          model = gltf.scene;
          const bounds = new THREE.Box3().setFromObject(model);
          const size = bounds.getSize(new THREE.Vector3());
          const center = bounds.getCenter(new THREE.Vector3());
          const scale = 3.55 / Math.max(size.y, 0.01);
          model.scale.setScalar(scale);
          model.position.set(-center.x * scale, -bounds.min.y * scale - 1.78, -center.z * scale);
          model.traverse((object) => {
            if (object instanceof THREE.Mesh) {
              object.castShadow = false;
              object.receiveShadow = false;
            }
          });
          scene.add(model);

          if (gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model);
            const normalizedName = animationClip.toLowerCase().replace(/[^a-z0-9]/g, "");
            const clip = gltf.animations.find((candidate) => (
              candidate.name.toLowerCase().replace(/[^a-z0-9]/g, "") === normalizedName
            )) ?? gltf.animations.find((candidate) => candidate.name === "Idle") ?? gltf.animations[0];
            mixer.clipAction(clip).reset().play();
          }
          setStatus("拖动她，可以转个身");
        },
        (event) => {
          if (event.total > 0) setStatus(`正在唤醒庞菠菠… ${Math.round(event.loaded / event.total * 100)}%`);
        },
        () => {
          if (disposed) return;
          if (urlIndex + 1 < modelUrls.length) {
            setStatus("在线模型未就绪，正在换用随身版本…");
            loadModel(urlIndex + 1);
          } else {
            setStatus("3D 模型暂时走丢了，卡片仍可收藏");
          }
        },
      );
    };
    loadModel(0);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [animationClip, modelAssetKey, seriesCode]);

  return (
    <div className="blindbox-viewer" ref={hostRef} aria-label={`${variantName} 3D 展示`}>
      <p className="blindbox-viewer-status" aria-live="polite">{status}</p>
    </div>
  );
}
