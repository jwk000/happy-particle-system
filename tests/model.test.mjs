import test from "node:test";
import assert from "node:assert/strict";
import {
  newProject,
  presets,
  parseProject,
  setNumber,
  curveValue,
  pathPoint,
} from "../src/model.js";
import { ParticleEngine } from "../src/engine.js";

test("all presets survive JSON round trip without sharing nested state", () => {
  for (const preset of presets) {
    const p = newProject(preset.id);
    assert.deepEqual(parseProject(JSON.stringify(p)), p);
    p.config.anchors[0][0] = 999;
    assert.notEqual(newProject(preset.id).config.anchors[0][0], 999);
  }
});
test("number edits clamp bounds and maintain paired min/max", () => {
  const c = newProject().config;
  assert.equal(setNumber(c, "rate", Infinity), false);
  assert.equal(setNumber(c, "rate", ""), false);
  setNumber(c, "maxParticles", 99999);
  assert.equal(c.maxParticles, 2000);
  setNumber(c, "lifeMin", 2);
  assert.equal(c.lifeMax, 2);
  setNumber(c, "lifeMax", 0.1);
  assert.equal(c.lifeMin, 0.1);
  setNumber(c, "rotationMin", 300);
  assert.equal(c.rotationMax, 300);
});
test("invalid imports cannot inject URLs, invalid enums or unbounded simulation values", () => {
  for (const patch of [
    { rate: -1 },
    { rate: null },
    { shape: "evil" },
    { texture: "https://example.com/track" },
    { texture: "data:image/svg+xml;base64,abc" },
    { trailEnabled: "true" },
    { anchors: [[0, 0]] },
    {
      sizeCurve: [
        [0, 1],
        [0, 0.2],
        [1, 0],
      ],
    },
    { lifeMin: 4, lifeMax: 1 },
    {
      anchors: [
        [0, 0],
        [Infinity, 3],
      ],
    },
  ]) {
    const p = newProject();
    Object.assign(p.config, patch);
    assert.throws(() => parseProject(p));
  }
  assert.throws(() => parseProject("{ invalid json }"));
  assert.throws(() => parseProject({ format: "unknown" }));
});
test("import validates curves and defaults missing fields for runtime exports", () => {
  const p = newProject();
  delete p.config.previewSpeed;
  p.format = "happy-trail-effect";
  assert.equal(parseProject(p).config.previewSpeed, 1);
  p.config.sizeCurve = [
    [0, 1],
    [0.5, 2],
    [1, 0],
  ];
  assert.throws(() => parseProject(p));
});
test("curve interpolation and endpoints are stable", () => {
  const c = [
    [0, 0],
    [0.2, 1],
    [1, 0],
  ];
  assert.equal(curveValue(c, 0), 0);
  assert.equal(curveValue(c, 0.1), 0.5);
  assert.equal(curveValue(c, 0.2), 1);
  assert.equal(curveValue(c, 1), 0);
});
test("paths preserve endpoints and close loops for every easing mode", () => {
  for (const easing of ["linear", "smooth", "in", "out"]) {
    const c = newProject().config;
    c.easing = easing;
    assert.deepEqual(pathPoint(c, 0), c.anchors[0]);
    assert.deepEqual(pathPoint(c, 1), c.anchors.at(-1));
    c.closed = true;
    assert.deepEqual(pathPoint(c, 1), c.anchors[0]);
    for (let i = 0; i <= 100; i++)
      assert.ok(pathPoint(c, i / 100).every(Number.isFinite));
  }
});
function simulation() {
  const p = newProject(),
    engine = Object.create(ParticleEngine.prototype);
  engine.getProject = () => p;
  engine.mode = "auto";
  engine.pointer = [0, 0];
  engine.reset();
  return { p, engine };
}
test("emission respects exact requested count and remaining capacity", () => {
  const { p, engine } = simulation();
  p.config.maxParticles = 10;
  engine.emit([0, 0], [0, 0], 8);
  assert.equal(engine.particles.length, 8);
  engine.emit([0, 0], [0, 0], 8);
  assert.equal(engine.particles.length, 10);
});
test("sustained emission is frame-rate independent and bounded", () => {
  for (const hz of [30, 60, 120]) {
    const { p, engine } = simulation();
    Object.assign(p.config, {
      rate: 60,
      moveRate: 0,
      burst: 0,
      lifeMin: 10,
      lifeMax: 10,
      maxParticles: 500,
    });
    for (let i = 0; i < hz; i++) engine.update(1 / hz);
    assert.equal(engine.particles.length, 60);
    p.config.maxParticles = 5;
    engine.update(0.01);
    assert.ok(engine.particles.length <= 5);
  }
});
test("finite playback stops emitting and all particles expire", () => {
  const { p, engine } = simulation();
  Object.assign(p.config, {
    loop: false,
    duration: 0.2,
    lifeMin: 0.1,
    lifeMax: 0.1,
  });
  for (let i = 0; i < 120; i++) engine.update(1 / 60);
  assert.equal(engine.particles.length, 0);
  assert.equal(engine.trail.length, 0);
});
test("manual mode only emits while drawing, and teleport breaks trail", () => {
  const { p, engine } = simulation();
  engine.mode = "draw";
  engine.update(0.05);
  assert.equal(engine.particles.length, 0);
  engine.drawing = true;
  engine.update(0.05);
  assert.ok(engine.particles.length > 0);
  engine.pointer = [1000, 0];
  engine.update(0.05);
  assert.equal(engine.trail.length, 1);
  assert.equal(engine.trail[0].x, 1000);
});
test("gravity and resistance update particle motion", () => {
  const { p, engine } = simulation();
  Object.assign(p.config, {
    rate: 0,
    moveRate: 0,
    burst: 0,
    speedMin: 0,
    speedMax: 0,
    gravityX: 100,
    gravityY: 100,
    drag: 0,
  });
  engine.emit([0, 0], [0, 0], 1);
  engine.update(0.1);
  assert.ok(engine.particles[0].vx > 0);
  assert.ok(engine.particles[0].vy < 0);
});
