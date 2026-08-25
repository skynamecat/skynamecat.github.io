import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

type ModelStageProps = { clipName: string; modelUrl?: string };

export function ModelStage({ clipName, modelUrl = "/pangbobo/pangbobo-actions-lite.glb" }: ModelStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("正在加载模型…");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
    camera.position.set(0, 1.15, 4.6);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff8e8, 0x314536, 2.6));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    scene.add(key);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.35, 64),
      new THREE.MeshStandardMaterial({ color: 0xc7d1bd, roughness: 0.92 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 2.8;
    controls.maxDistance = 6;
    controls.target.set(0, 1, 0);

    const clock = new THREE.Clock();
    let mixer: THREE.AnimationMixer | undefined;
    let animationFrame = 0;
    let disposed = false;

    new GLTFLoader().load(
      modelUrl,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        model.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const scale = 2.15 / Math.max(size.y, 0.001);
        model.scale.setScalar(scale);
        box.setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -box.min.y, -center.z);
        scene.add(model);

        mixer = new THREE.AnimationMixer(model);
        const clip = THREE.AnimationClip.findByName(gltf.animations, clipName) ?? gltf.animations[0];
        if (clip) mixer.clipAction(clip).reset().fadeIn(0.35).play();
        setMessage(clip ? `${clip.name} · ${clip.duration.toFixed(1)} 秒` : "模型中没有动画片段");
      },
      undefined,
      () => setMessage("模型加载失败，请确认公开站已在 3000 端口运行")
    );

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const animate = () => {
      animationFrame = requestAnimationFrame(animate);
      mixer?.update(Math.min(clock.getDelta(), 0.05));
      controls.update();
      renderer.render(scene, camera);
    };
    resize();
    animate();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(animationFrame);
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [clipName, modelUrl]);

  return <div className="model-stage" ref={hostRef}><span className="stage-caption">{message}</span></div>;
}
