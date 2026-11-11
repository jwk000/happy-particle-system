import { clamp, curveValue, pathPoint } from "./model.js";
const rand = (a, b) => a + Math.random() * (b - a);
const mix = (a, b, t) => {
  const channels = [1, 3, 5].map((i) =>
    Math.round(
      parseInt(a.slice(i, i + 2), 16) * (1 - t) +
        parseInt(b.slice(i, i + 2), 16) * t,
    ),
  );
  return `rgb(${channels.join(",")})`;
};
export class ParticleEngine {
  constructor(canvas, getProject, onStats) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.getProject = getProject;
    this.onStats = onStats;
    this.mode = "auto";
    this.paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.pointer = [0, 0];
    this.drawing = false;
    this.selectedAnchor = 0;
    this.images = new Map();
    this.reset();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.last = performance.now();
    this.statsTime = this.last;
    this.frames = 0;
    const tick = (now) => {
      const dt = Math.min((now - this.last) / 1000, 0.05);
      this.last = now;
      if (!this.paused) this.update(dt * this.getProject().config.previewSpeed);
      this.render();
      this.frames++;
      if (now - this.statsTime > 500) {
        onStats(
          this.particles.length,
          this.trail.length,
          Math.round((this.frames * 1000) / (now - this.statsTime)),
        );
        this.statsTime = now;
        this.frames = 0;
      }
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
  reset() {
    this.particles = [];
    this.trail = [];
    this.time = 0;
    this.remainder = 0;
    this.previous = null;
    this.started = false;
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.w = r.width;
    this.h = r.height;
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
  }
  world(e) {
    const r = this.canvas.getBoundingClientRect(),
      z = this.getProject().view.zoom;
    return [
      (e.clientX - r.left - r.width / 2) / z,
      (e.clientY - r.top - r.height / 2) / z,
    ];
  }
  image(src) {
    if (!src) return null;
    if (!this.images.has(src)) {
      if (this.images.size > 8) this.images.clear();
      const img = new Image();
      img.src = src;
      this.images.set(src, img);
    }
    const img = this.images.get(src);
    return img.complete && img.naturalWidth ? img : null;
  }
  emit(position, velocity, count) {
    const c = this.getProject().config;
    const available = Math.min(count, c.maxParticles - this.particles.length);
    for (let i = 0; i < available; i++) {
      let [x, y] = position;
      if (c.emitter === "circle") {
        const angle =
            ((rand(-c.arc / 2, c.arc / 2) + c.arcDirection) * Math.PI) / 180,
          r = c.radius * (c.edge ? 1 : Math.sqrt(Math.random()));
        x += Math.cos(angle) * r;
        y -= Math.sin(angle) * r;
      }
      if (c.emitter === "rect") {
        x += rand(-c.emitterWidth / 2, c.emitterWidth / 2);
        y += rand(-c.emitterHeight / 2, c.emitterHeight / 2);
      }
      if (c.emitter === "line")
        x += rand(-c.emitterWidth / 2, c.emitterWidth / 2);
      const angle =
          ((c.direction + rand(-c.spread / 2, c.spread / 2)) * Math.PI) / 180,
        speed = rand(c.speedMin, c.speedMax);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed + (velocity[0] * c.inherit) / 100,
        vy: -Math.sin(angle) * speed + (velocity[1] * c.inherit) / 100,
        age: 0,
        life: rand(c.lifeMin, c.lifeMax),
        size: rand(c.sizeMin, c.sizeMax),
        rotation: rand(0, Math.PI * 2),
        spin: (rand(c.rotationMin, c.rotationMax) * Math.PI) / 180,
      });
    }
  }
  update(dt) {
    const c = this.getProject().config,
      oldTime = this.time;
    this.time += dt;
    const progress = c.loop
      ? (this.time % c.duration) / c.duration
      : Math.min(1, this.time / c.duration);
    const pos =
      this.mode === "auto" && c.pathEnabled
        ? pathPoint(c, progress)
        : this.pointer;
    const active =
      this.mode === "auto"
        ? !c.pathEnabled || c.loop || this.time <= c.duration
        : this.mode === "draw" && this.drawing;
    let distance = this.previous
      ? Math.hypot(pos[0] - this.previous[0], pos[1] - this.previous[1])
      : 0;
    const wrapped =
      this.mode === "auto" &&
      c.loop &&
      !c.closed &&
      Math.floor(oldTime / c.duration) !== Math.floor(this.time / c.duration);
    const broken = wrapped || distance > c.breakDistance;
    if (broken) {
      this.trail = [];
      distance = 0;
    }
    const velocity =
      this.previous && distance && dt > 0
        ? [(pos[0] - this.previous[0]) / dt, (pos[1] - this.previous[1]) / dt]
        : [0, 0];
    if (active) {
      if (!this.started) {
        this.emit(pos, velocity, c.burst);
        this.started = true;
      }
      this.remainder += c.rate * dt + (distance * c.moveRate) / 100;
      const count = Math.floor(this.remainder);
      this.remainder -= count;
      if (count) this.emit(pos, velocity, count);
      const last = this.trail.at(-1);
      if (
        c.trailEnabled &&
        (!last || Math.hypot(pos[0] - last.x, pos[1] - last.y) >= c.spacing)
      )
        this.trail.push({ x: pos[0], y: pos[1], age: 0 });
    }
    this.previous = [...pos];
    this.position = pos;
    this.trail = this.trail
      .filter((p) => {
        p.age += dt;
        return p.age < c.trailLife;
      })
      .slice(-c.maxNodes);
    this.particles = this.particles
      .filter((p) => {
        p.age += dt;
        if (p.age >= p.life) return false;
        p.vx = (p.vx + c.gravityX * dt) * Math.exp(-c.drag * dt);
        p.vy = (p.vy - c.gravityY * dt) * Math.exp(-c.drag * dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.spin * dt;
        return true;
      })
      .slice(-c.maxParticles);
  }
  render() {
    if (!this.w || !this.h) return;
    const x = this.ctx,
      { config: c, view } = this.getProject(),
      w = this.w,
      h = this.h;
    x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    x.globalAlpha = 1;
    x.globalCompositeOperation = "source-over";
    const bg = x.createRadialGradient(
      w * 0.42,
      h * 0.45,
      0,
      w * 0.5,
      h * 0.5,
      Math.max(w, h),
    );
    bg.addColorStop(0, view.background === "light" ? "#f6f8f9" : "#193a40");
    bg.addColorStop(1, view.background === "light" ? "#e3eaed" : "#102129");
    x.fillStyle = bg;
    x.fillRect(0, 0, w, h);
    x.translate(w / 2, h / 2);
    x.scale(view.zoom, view.zoom);
    if (view.background === "board") {
      x.fillStyle = "#102d34";
      x.beginPath();
      x.roundRect(-200, -152, 400, 304, 14);
      x.fill();
      const colors = ["#39423e", "#23454a", "#30414e", "#344c3a", "#284d59"];
      for (let row = 0; row < 6; row++)
        for (let col = 0; col < 8; col++) {
          const px = col * 48 - 190,
            py = row * 48 - 142;
          x.globalAlpha = 0.65;
          x.fillStyle = colors[(col + row * 2) % colors.length];
          x.beginPath();
          x.roundRect(px, py, 42, 42, 8);
          x.fill();
          x.fillStyle = "#a3c3c9";
          x.globalAlpha = 0.12;
          x.beginPath();
          x.arc(px + 15, py + 14, 3.5, 0, Math.PI * 2);
          x.fill();
        }
      x.globalAlpha = 1;
    } else {
      x.strokeStyle = view.background === "light" ? "#ccd7dc" : "#294047";
      x.lineWidth = 1 / view.zoom;
      x.beginPath();
      for (
        let gx = -Math.ceil(w / 2 / view.zoom / 48) * 48;
        gx <= w / 2 / view.zoom;
        gx += 48
      ) {
        x.moveTo(gx, -h / view.zoom / 2);
        x.lineTo(gx, h / view.zoom / 2);
      }
      for (
        let gy = -Math.ceil(h / 2 / view.zoom / 48) * 48;
        gy <= h / 2 / view.zoom;
        gy += 48
      ) {
        x.moveTo(-w / view.zoom / 2, gy);
        x.lineTo(w / view.zoom / 2, gy);
      }
      x.stroke();
    }
    if (c.trailEnabled) {
      x.globalCompositeOperation = c.trailBlend;
      const texture = this.image(c.trailTexture);
      for (let i = 1; i < this.trail.length; i++) {
        const a = this.trail[i - 1],
          b = this.trail[i],
          age = clamp(b.age / c.trailLife, 0, 1),
          width = Math.max(
            0.1,
            c.trailWidth * curveValue(c.trailWidthCurve, age),
          );
        x.globalAlpha = curveValue(c.trailAlphaCurve, age);
        x.strokeStyle = mix(c.trailStart, c.trailEnd, age);
        x.lineWidth = width;
        x.lineCap = "round";
        // shortcut: trail textures repeat per segment; use a UV-mapped mesh for continuous stretch/rotation.
        if (texture) {
          x.save();
          x.translate(a.x, a.y);
          x.rotate(Math.atan2(b.y - a.y, b.x - a.x));
          x.drawImage(
            texture,
            0,
            -width / 2,
            Math.hypot(b.x - a.x, b.y - a.y) + 1,
            width,
          );
          x.restore();
        } else {
          x.beginPath();
          x.moveTo(a.x, a.y);
          x.lineTo(b.x, b.y);
          x.stroke();
        }
      }
    }
    x.globalCompositeOperation = c.blend;
    const texture = this.image(c.texture);
    for (const p of this.particles) {
      const t = p.age / p.life,
        size = p.size * curveValue(c.sizeCurve, t),
        color =
          t < 0.5
            ? mix(c.colorStart, c.colorMid, t * 2)
            : mix(c.colorMid, c.colorEnd, (t - 0.5) * 2);
      if (size < 0.05) continue;
      x.save();
      x.translate(p.x, p.y);
      x.rotate(p.rotation);
      x.globalAlpha = curveValue(c.alphaCurve, t);
      x.fillStyle = color;
      if (texture) x.drawImage(texture, -size / 2, -size / 2, size, size);
      else if (c.shape === "glow") {
        const g = x.createRadialGradient(0, 0, 0, 0, 0, size / 2);
        g.addColorStop(0, "#fff");
        g.addColorStop(0.15, color);
        g.addColorStop(1, "transparent");
        x.fillStyle = g;
        x.fillRect(-size / 2, -size / 2, size, size);
      } else {
        x.beginPath();
        if (c.shape === "star" || c.shape === "crystal") {
          const points = c.shape === "star" ? 8 : 4;
          for (let i = 0; i < points; i++) {
            const a = (i / points) * Math.PI * 2,
              r = c.shape === "star" && i % 2 ? size * 0.13 : size / 2;
            x.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          x.closePath();
        } else if (c.shape === "leaf")
          x.ellipse(0, 0, size / 2, size / 5, 0, 0, Math.PI * 2);
        else x.arc(0, 0, size / 2, 0, Math.PI * 2);
        x.fill();
      }
      x.restore();
    }
    x.globalAlpha = 1;
    x.globalCompositeOperation = "source-over";
    if (this.mode === "edit") {
      x.strokeStyle = "#e99586";
      x.lineWidth = 1.5 / view.zoom;
      x.setLineDash([5, 5]);
      x.beginPath();
      for (let i = 0; i <= 150; i++) {
        const p = pathPoint({ ...c, easing: "linear" }, i / 150);
        if (!i) x.moveTo(...p);
        else x.lineTo(...p);
      }
      x.stroke();
      x.setLineDash([]);
      c.anchors.forEach((p, i) => {
        x.beginPath();
        x.arc(p[0], p[1], 7 / view.zoom, 0, Math.PI * 2);
        x.fillStyle = i === this.selectedAnchor ? "#e46b5e" : "#fff";
        x.fill();
        x.stroke();
        x.fillStyle = view.background === "light" ? "#33454b" : "#fff";
        x.font = `${11 / view.zoom}px system-ui`;
        x.fillText(`${i + 1}`, p[0] + 12 / view.zoom, p[1] - 12 / view.zoom);
      });
    }
    x.globalAlpha = 1;
  }
}
