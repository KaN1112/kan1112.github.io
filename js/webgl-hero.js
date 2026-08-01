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
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (container && hero && !reducedMotion.matches) {
  try {
    initWebGL();
  } catch {
    container.classList.add("webgl-unavailable");
  }
}

function initWebGL() {
  const testCanvas = document.createElement("canvas");
  const canUseWebGL = Boolean(
    testCanvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ||
    testCanvas.getContext("webgl", { failIfMajorPerformanceCaveat: true })
  );

  if (!canUseWebGL) {
    container.classList.add("webgl-unavailable");
    return;
  }

  const THREE = window.THREE;
  if (!THREE) {
    container.classList.add("webgl-unavailable");
    return;
  }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 30);
  camera.position.z = 5.8;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: "low-power"
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  const isCompact = window.matchMedia("(max-width: 800px)").matches;
  const particleCount = isCompact ? 85 : 175;
  container.dataset.particleCount = String(particleCount);
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const drift = new Float32Array(particleCount * 3);
  const white = new THREE.Color(0xf2f2f2);
  const orange = new THREE.Color(0xff6a00);

  for (let index = 0; index < particleCount; index += 1) {
    const offset = index * 3;
    positions[offset] = THREE.MathUtils.randFloatSpread(11);
    positions[offset + 1] = THREE.MathUtils.randFloatSpread(7);
    positions[offset + 2] = THREE.MathUtils.randFloat(-2.4, 1.1);

    const color = Math.random() < 0.28 ? orange : white;
    colors[offset] = color.r;
    colors[offset + 1] = color.g;
    colors[offset + 2] = color.b;

    drift[offset] = THREE.MathUtils.randFloat(-0.0008, 0.0008);
    drift[offset + 1] = THREE.MathUtils.randFloat(0.00035, 0.0012);
    drift[offset + 2] = THREE.MathUtils.randFloat(-0.00025, 0.00025);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: isCompact ? 0.045 : 0.052,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.66,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  /* A sparse network makes the depth clearly WebGL without becoming flashy. */
  const connectionLimit = isCompact ? 14 : 30;
  const connectionPairs = [];
  for (let source = 0; source < particleCount && connectionPairs.length < connectionLimit; source += 4) {
    const sourceOffset = source * 3;
    let nearest = -1;
    let nearestDistance = 2.15;
    for (let target = source + 1; target < particleCount; target += 1) {
      const targetOffset = target * 3;
      const dx = positions[sourceOffset] - positions[targetOffset];
      const dy = positions[sourceOffset + 1] - positions[targetOffset + 1];
      const dz = positions[sourceOffset + 2] - positions[targetOffset + 2];
      const distance = Math.hypot(dx, dy, dz);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = target;
      }
    }
    if (nearest >= 0) connectionPairs.push([source, nearest]);
  }

  const linePositions = new Float32Array(connectionPairs.length * 6);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xff7a1a,
    transparent: true,
    opacity: isCompact ? 0.16 : 0.2,
    depthWrite: false
  });
  const connectionLines = new THREE.LineSegments(lineGeometry, lineMaterial);
  scene.add(connectionLines);

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let scrollProgress = 0;
  let frameId = 0;
  let running = false;
  let previousTime = 0;

  const resize = () => {
    const width = Math.max(hero.clientWidth, 1);
    const height = Math.max(hero.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height, false);
  };

  const updatePointer = (event) => {
    pointer.targetX = (event.clientX / window.innerWidth - 0.5) * 0.34;
    pointer.targetY = (event.clientY / window.innerHeight - 0.5) * -0.22;
  };

  const updateScroll = () => {
    scrollProgress = Math.min(window.scrollY / Math.max(hero.clientHeight, 1), 1.25);
  };

  const render = (time) => {
    if (!running) return;
    const deltaScale = Math.min((time - previousTime) / 16.67 || 1, 2);
    previousTime = time;
    const attribute = geometry.attributes.position;

    for (let index = 0; index < particleCount; index += 1) {
      const offset = index * 3;
      attribute.array[offset] += drift[offset] * deltaScale;
      attribute.array[offset + 1] += drift[offset + 1] * deltaScale;
      attribute.array[offset + 2] += drift[offset + 2] * deltaScale;

      if (attribute.array[offset] > 5.6) attribute.array[offset] = -5.6;
      if (attribute.array[offset] < -5.6) attribute.array[offset] = 5.6;
      if (attribute.array[offset + 1] > 3.6) attribute.array[offset + 1] = -3.6;
    }
    attribute.needsUpdate = true;

    const lineAttribute = lineGeometry.attributes.position;
    connectionPairs.forEach(([source, target], pairIndex) => {
      const lineOffset = pairIndex * 6;
      const sourceOffset = source * 3;
      const targetOffset = target * 3;
      lineAttribute.array[lineOffset] = attribute.array[sourceOffset];
      lineAttribute.array[lineOffset + 1] = attribute.array[sourceOffset + 1];
      lineAttribute.array[lineOffset + 2] = attribute.array[sourceOffset + 2];
      lineAttribute.array[lineOffset + 3] = attribute.array[targetOffset];
      lineAttribute.array[lineOffset + 4] = attribute.array[targetOffset + 1];
      lineAttribute.array[lineOffset + 5] = attribute.array[targetOffset + 2];
    });
    lineAttribute.needsUpdate = true;

    pointer.x += (pointer.targetX - pointer.x) * 0.025;
    pointer.y += (pointer.targetY - pointer.y) * 0.025;
    camera.position.x = pointer.x;
    camera.position.y = pointer.y - scrollProgress * 0.16;
    points.rotation.z = pointer.x * 0.018;
    points.position.y = scrollProgress * 0.1;
    connectionLines.rotation.z = points.rotation.z;
    connectionLines.position.y = points.position.y;
    renderer.render(scene, camera);
    frameId = window.requestAnimationFrame(render);
  };

  const start = () => {
    if (running || document.hidden) return;
    running = true;
    container.dataset.rendering = "true";
    previousTime = 0;
    frameId = window.requestAnimationFrame(render);
  };

  const stop = () => {
    running = false;
    container.dataset.rendering = "false";
    window.cancelAnimationFrame(frameId);
  };

  const handleVisibility = () => document.hidden ? stop() : start();
  const handleMotionPreference = (event) => {
    if (event.matches) {
      stop();
      container.classList.remove("is-ready");
    } else {
      start();
      container.classList.add("is-ready");
    }
  };

  resize();
  updateScroll();
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", updatePointer, { passive: true });
  window.addEventListener("scroll", updateScroll, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility);
  reducedMotion.addEventListener("change", handleMotionPreference);
  container.classList.add("is-ready");
  start();

  window.addEventListener("pagehide", () => {
    stop();
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", updatePointer);
    window.removeEventListener("scroll", updateScroll);
    document.removeEventListener("visibilitychange", handleVisibility);
    reducedMotion.removeEventListener("change", handleMotionPreference);
    geometry.dispose();
    material.dispose();
    lineGeometry.dispose();
    lineMaterial.dispose();
    renderer.dispose();
  }, { once: true });
}
