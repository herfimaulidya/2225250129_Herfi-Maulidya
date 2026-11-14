import { useEffect, useRef, useState } from 'react';

/**
 * Visualisasi 3D pendukung (Three.js): susunan n × n "ubin kristal" yang berputar pelan.
 * Three.js dimuat secara lazy agar halaman lain tetap ringan.
 * Bila WebGL tidak tersedia, komponen menampilkan pesan dan tidak mengganggu halaman.
 */
export default function MagicTiles3D({ n = 4, height = 260, className = '', label }) {
  const mountRef = useRef(null);
  const apiRef = useRef(null);
  const nRef = useRef(n);
  nRef.current = n;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    import('three')
      .then((THREE) => {
        if (disposed || !mountRef.current) return;
        const el = mountRef.current;
        let renderer;
        try {
          renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        } catch {
          setFailed(true);
          return;
        }
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        el.appendChild(renderer.domElement);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
        scene.add(new THREE.AmbientLight(0xffffff, 1.6));
        const sun = new THREE.DirectionalLight(0xfff1d6, 1.1);
        sun.position.set(4, 8, 6);
        scene.add(sun);
        const group = new THREE.Group();
        scene.add(group);
        const geo = new THREE.BoxGeometry(0.9, 0.35, 0.9);
        const matA = new THREE.MeshStandardMaterial({ color: 0xefafc5, roughness: 0.35, metalness: 0.1 });
        const matB = new THREE.MeshStandardMaterial({ color: 0xdcc6f2, roughness: 0.35, metalness: 0.1 });
        const matGold = new THREE.MeshStandardMaterial({ color: 0xf3d488, roughness: 0.45, metalness: 0, emissive: 0x6b5418, emissiveIntensity: 0.35 });

        const build = (size) => {
          while (group.children.length) group.remove(group.children[0]);
          const off = (size - 1) / 2;
          for (let r = 0; r < size; r += 1) {
            for (let c = 0; c < size; c += 1) {
              const isEdge = r === size - 1 || c === size - 1;
              const mesh = new THREE.Mesh(geo, isEdge && size > 1 ? matGold : (r + c) % 2 ? matB : matA);
              mesh.position.set(c - off, 0, r - off);
              group.add(mesh);
            }
          }
          const dist = Math.max(4, size * 1.9);
          camera.position.set(dist * 0.8, dist * 0.9, dist);
          camera.lookAt(0, 0, 0);
        };

        const resize = () => {
          const w = el.clientWidth || 300;
          renderer.setSize(w, height);
          camera.aspect = w / height;
          camera.updateProjectionMatrix();
        };
        build(nRef.current);
        resize();
        apiRef.current = { build };

        let raf = 0;
        const tick = () => {
          if (!reduce) group.rotation.y += 0.004;
          renderer.render(scene, camera);
          raf = requestAnimationFrame(tick);
        };
        tick();
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          geo.dispose();
          [matA, matB, matGold].forEach((m) => m.dispose());
          renderer.dispose();
          renderer.domElement.remove();
          apiRef.current = null;
        };
      })
      .catch(() => setFailed(true));
    return () => {
      disposed = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  useEffect(() => {
    apiRef.current?.build(n);
  }, [n]);

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-b from-royal-lavender/50 to-royal-blue/50 ${className}`} style={{ height }}>
      <div ref={mountRef} className="h-full w-full" aria-hidden="true" />
      {failed && (
        <p className="absolute inset-0 grid place-items-center p-4 text-center text-sm font-semibold text-royal-plum/70">
          Tampilan 3D tidak didukung perangkat ini. Gunakan tampilan 2D di atas.
        </p>
      )}
      {label && <span className="chip absolute left-3 top-3 bg-white/80">{label}</span>}
    </div>
  );
}
