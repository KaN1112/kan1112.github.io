let container = document.querySelector("[data-webgl-background]");
const pageHero = document.querySelector(".page-hero");

if (!container && pageHero) {
  container = document.createElement("div");
  container.className = "webgl-background";
  container.dataset.webglBackground = "";
  container.setAttribute("aria-hidden", "true");
  pageHero.prepend(container);
}

const hero = container?.closest(".hero, .page-hero");
const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (container && hero && !motion.matches && window.THREE) {
  try { initWebGL(); } catch { container.classList.add("webgl-unavailable"); }
}

function initWebGL() {
  const test = document.createElement("canvas");
  if (!test.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) && !test.getContext("webgl", { failIfMajorPerformanceCaveat: true })) {
    container.classList.add("webgl-unavailable");
    return;
  }

  const THREE = window.THREE;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 50);
  camera.position.set(0, 0, 11);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  const compact = matchMedia("(max-width: 800px)").matches;
  const structure = new THREE.Group();
  structure.position.x = compact ? 1.2 : 2.5;
  scene.add(structure);

  const orange = new THREE.LineBasicMaterial({ color: 0xff6a00, transparent: true, opacity: .82 });
  const pale = new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: .22 });
  const darkFace = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .76, side: THREE.DoubleSide });
  const accentFace = new THREE.MeshBasicMaterial({ color: 0xff6a00, transparent: true, opacity: .14, side: THREE.DoubleSide });
  const count = compact ? 7 : 13;
  const geometries = [], materials = [orange, pale, darkFace, accentFace];

  for (let i = 0; i < count; i++) {
    const w = 1.1 + (i % 4) * .48;
    const h = .75 + (i % 3) * .55;
    const d = .18 + (i % 2) * .18;
    const box = new THREE.BoxGeometry(w, h, d);
    geometries.push(box);
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(box), i % 3 === 0 ? pale : orange);
    frame.position.set(((i * 1.73) % 7) - 3.1, ((i * 2.1) % 6) - 2.6, -i * .28);
    frame.rotation.set((i % 3 - 1) * .12, (i % 4 - 1.5) * .16, (i % 2 ? -1 : 1) * .08);
    frame.userData = { phase: i * .7, speed: .00013 + (i % 4) * .000025, baseY: frame.position.y };
    structure.add(frame);
    if (i % 3 === 0) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(w * .88, h * .84), i % 2 ? accentFace : darkFace);
      geometries.push(panel.geometry);
      panel.position.copy(frame.position);
      panel.position.z += .03;
      panel.rotation.copy(frame.rotation);
      panel.userData.frame = frame;
      structure.add(panel);
    }
  }

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let scroll = 0, frameId = 0, running = true;
  const resize = () => {
    const width = Math.max(hero.clientWidth, 1), height = Math.max(hero.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
  };
  const onPointer = event => { pointer.tx = (event.clientX / innerWidth - .5) * .7; pointer.ty = (event.clientY / innerHeight - .5) * -.45; };
  const onScroll = () => { scroll = Math.min(scrollY / Math.max(hero.clientHeight, 1), 1.2); };
  const render = time => {
    if (!running) return;
    pointer.x += (pointer.tx - pointer.x) * .035;
    pointer.y += (pointer.ty - pointer.y) * .035;
    structure.rotation.y = -.12 + pointer.x * .24;
    structure.rotation.x = pointer.y * .16 - scroll * .04;
    structure.position.y = scroll * .18;
    structure.children.forEach(object => {
      if (object.userData.baseY !== undefined) {
        object.position.y = object.userData.baseY + Math.sin(time * object.userData.speed + object.userData.phase) * .11;
        object.rotation.y += .00022;
      } else if (object.userData.frame) {
        object.position.y = object.userData.frame.position.y;
        object.rotation.copy(object.userData.frame.rotation);
      }
    });
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
  };
  const visibility = () => {
    running = !document.hidden;
    if (running) frameId = requestAnimationFrame(render); else cancelAnimationFrame(frameId);
  };

  resize(); onScroll();
  addEventListener("resize", resize, { passive: true });
  addEventListener("pointermove", onPointer, { passive: true });
  addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", visibility);
  container.classList.add("is-ready");
  frameId = requestAnimationFrame(render);

  addEventListener("pagehide", () => {
    running = false; cancelAnimationFrame(frameId);
    geometries.forEach(item => item.dispose());
    materials.forEach(item => item.dispose());
    renderer.dispose();
  }, { once: true });
}
