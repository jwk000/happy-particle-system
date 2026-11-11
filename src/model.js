export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const fields = {
  radius: [0, 200, 1],
  arc: [0, 360, 1],
  arcDirection: [-180, 180, 1],
  emitterWidth: [0, 400, 1],
  emitterHeight: [0, 400, 1],
  maxParticles: [1, 2000, 1],
  moveRate: [0, 200, 1],
  rate: [0, 500, 1],
  burst: [0, 500, 1],
  lifeMin: [0.05, 10, 0.01],
  lifeMax: [0.05, 10, 0.01],
  previewSpeed: [0.1, 3, 0.1],
  breakDistance: [10, 1000, 1],
  sizeMin: [1, 100, 1],
  sizeMax: [1, 100, 1],
  speedMin: [0, 500, 1],
  speedMax: [0, 500, 1],
  direction: [-180, 180, 1],
  spread: [0, 360, 1],
  inherit: [0, 100, 1],
  gravityX: [-500, 500, 1],
  gravityY: [-500, 500, 1],
  drag: [0, 10, 0.1],
  rotationMin: [-720, 720, 1],
  rotationMax: [-720, 720, 1],
  trailLife: [0.05, 3, 0.01],
  trailWidth: [1, 100, 1],
  spacing: [1, 30, 1],
  maxNodes: [2, 500, 1],
  duration: [0.2, 15, 0.1],
};
const base = {
  emitter: "circle",
  radius: 5,
  arc: 360,
  arcDirection: 0,
  edge: false,
  emitterWidth: 40,
  emitterHeight: 20,
  maxParticles: 220,
  moveRate: 24,
  rate: 8,
  burst: 2,
  lifeMin: 0.38,
  lifeMax: 0.72,
  previewSpeed: 1,
  breakDistance: 180,
  shape: "glow",
  sizeMin: 8,
  sizeMax: 19,
  blend: "lighter",
  colorStart: "#fff8c7",
  colorMid: "#ffd447",
  colorEnd: "#ff6b4a",
  texture: "",
  sizeCurve: [
    [0, 0.2],
    [0.2, 1],
    [1, 0],
  ],
  alphaCurve: [
    [0, 0],
    [0.12, 1],
    [1, 0],
  ],
  speedMin: 8,
  speedMax: 42,
  direction: 90,
  spread: 360,
  inherit: 8,
  gravityX: 0,
  gravityY: 22,
  drag: 1.2,
  rotationMin: -150,
  rotationMax: 150,
  trailEnabled: true,
  trailLife: 0.32,
  trailWidth: 20,
  spacing: 3,
  maxNodes: 96,
  trailBlend: "lighter",
  trailStart: "#fffbd6",
  trailEnd: "#49d6ff",
  trailTexture: "",
  trailWidthCurve: [
    [0, 1],
    [1, 0],
  ],
  trailAlphaCurve: [
    [0, 1],
    [1, 0],
  ],
  pathEnabled: true,
  duration: 3,
  loop: true,
  closed: false,
  easing: "smooth",
  anchors: [
    [-240, -150],
    [0, 80],
    [240, -130],
  ],
};
export const presets = [
  {
    id: "spark",
    name: "交换闪光",
    description: "棋子交换与指尖跟随",
    colors: ["#fff8c7", "#ffd447", "#f17353"],
    config: {},
  },
  {
    id: "rainbow",
    name: "彩虹连消",
    description: "强反馈的彩色连击轨迹",
    colors: ["#f3679b", "#ffd151", "#62d4f5"],
    config: {
      colorStart: "#ff75ce",
      colorMid: "#ffe75a",
      colorEnd: "#6adfff",
      shape: "star",
      rate: 35,
      moveRate: 40,
      sizeMin: 6,
      sizeMax: 16,
      trailStart: "#ffa4e5",
      trailEnd: "#57cfff",
      trailLife: 0.55,
      trailWidth: 25,
      duration: 2.5,
    },
  },
  {
    id: "vine",
    name: "藤蔓微光",
    description: "柔和自然的任务引导",
    colors: ["#efffc5", "#82d987", "#389975"],
    config: {
      colorStart: "#f0ffb5",
      colorMid: "#98e78c",
      colorEnd: "#3a9c78",
      shape: "leaf",
      rate: 15,
      speedMin: 12,
      speedMax: 32,
      lifeMin: 0.8,
      lifeMax: 1.5,
      trailStart: "#dbffae",
      trailEnd: "#49aa80",
      trailWidth: 12,
      duration: 4,
      gravityY: 15,
    },
  },
  {
    id: "ice",
    name: "冰晶冲刺",
    description: "清脆快速的直线动效",
    colors: ["#e2ffff", "#7de1f6", "#6083f2"],
    config: {
      colorStart: "#e8ffff",
      colorMid: "#88e6ff",
      colorEnd: "#6f85ff",
      shape: "crystal",
      trailStart: "#e2ffff",
      trailEnd: "#738bff",
      duration: 1.5,
      speedMin: 20,
      speedMax: 70,
      trailWidth: 17,
      anchors: [
        [-260, 70],
        [0, 0],
        [260, -70],
      ],
    },
  },
  {
    id: "fairy",
    name: "提示精灵",
    description: "低强度循环提示与引导",
    colors: ["#f8e8ff", "#ca91fb", "#8c60d7"],
    config: {
      colorStart: "#fff0ff",
      colorMid: "#daafff",
      colorEnd: "#9360df",
      trailStart: "#f6deff",
      trailEnd: "#a476df",
      shape: "star",
      rate: 10,
      moveRate: 15,
      sizeMin: 5,
      sizeMax: 13,
      trailWidth: 10,
      trailLife: 0.6,
      duration: 5,
      lifeMin: 0.6,
      lifeMax: 1.2,
    },
  },
];
export function newProject(id = "spark") {
  const p = presets.find((p) => p.id === id) || presets[0];
  return {
    format: "happy-trail-project",
    version: 1,
    name: p.name,
    preset: p.id,
    config: structuredClone({ ...base, ...p.config }),
    view: { background: "board", zoom: 1 },
  };
}
export function setNumber(config, key, value) {
  if (!fields[key] || !Number.isFinite(Number(value)) || value === "")
    return false;
  const [min, max, step] = fields[key];
  config[key] = Number(
    (Math.round(clamp(Number(value), min, max) / step) * step).toFixed(3),
  );
  for (const prefix of ["life", "size", "speed", "rotation"]) {
    if (key === `${prefix}Min` && config[key] > config[`${prefix}Max`])
      config[`${prefix}Max`] = config[key];
    if (key === `${prefix}Max` && config[key] < config[`${prefix}Min`])
      config[`${prefix}Min`] = config[key];
  }
  return true;
}
export function curveValue(points, t) {
  if (t <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i],
      [px, py] = points[i - 1];
    if (t <= x) return py + ((y - py) * (t - px)) / (x - px || 1);
  }
  return points.at(-1)[1];
}
export function pathPoint(c, progress) {
  const points = c.anchors;
  let t = clamp(progress, 0, 1);
  if (c.easing === "smooth") t = t * t * (3 - 2 * t);
  if (c.easing === "in") t *= t;
  if (c.easing === "out") t = 1 - (1 - t) ** 2;
  const segments = c.closed ? points.length : points.length - 1;
  const f = t * segments,
    i = Math.min(segments - 1, Math.floor(f)),
    u = f - i;
  const at = (n) =>
    points[
      c.closed
        ? (n + points.length) % points.length
        : clamp(n, 0, points.length - 1)
    ];
  const a = at(i - 1),
    b = at(i),
    d = at(i + 1),
    e = at(i + 2);
  return [0, 1].map(
    (k) =>
      0.5 *
      (2 * b[k] +
        (-a[k] + d[k]) * u +
        (2 * a[k] - 5 * b[k] + 4 * d[k] - e[k]) * u * u +
        (-a[k] + 3 * b[k] - 3 * d[k] + e[k]) * u * u * u),
  );
}
export function parseProject(input) {
  const raw = typeof input === "string" ? JSON.parse(input) : input;
  if (
    !raw ||
    !["happy-trail-project", "happy-trail-effect"].includes(raw.format) ||
    raw.version !== 1 ||
    !raw.config ||
    typeof raw.config !== "object"
  )
    throw new Error("不支持的文件格式，请选择 Trail Studio 导出的 JSON 文件");
  const out = newProject(raw.preset),
    c = out.config;
  if (typeof raw.name !== "string" || !raw.name.trim())
    throw new Error("项目名称不能为空");
  out.name = raw.name.slice(0, 80);
  for (const [key, value] of Object.entries(raw.config)) {
    if (!(key in base)) continue;
    if (key in fields) {
      if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < fields[key][0] ||
        value > fields[key][1]
      )
        throw new Error(`参数 ${key} 超出允许范围`);
      c[key] = value;
    } else if (key.endsWith("Curve") || key === "anchors") {
      if (
        !Array.isArray(value) ||
        value.length < 2 ||
        value.length > 100 ||
        !value.every(
          (p) => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite),
        )
      )
        throw new Error(`无效的 ${key}`);
      if (
        key.endsWith("Curve") &&
        (value[0][0] !== 0 ||
          value.at(-1)[0] !== 1 ||
          value.some(
            (p, i) =>
              p[0] < 0 ||
              p[0] > 1 ||
              p[1] < 0 ||
              p[1] > 1 ||
              (i > 0 && p[0] <= value[i - 1][0]),
          ))
      )
        throw new Error("曲线必须从 0 到 1 严格递增，数值范围为 0–1");
      if (
        key === "anchors" &&
        value.some((p) => p.some((n) => Math.abs(n) > 10000))
      )
        throw new Error("锚点坐标超出范围");
      c[key] = structuredClone(value);
    } else if (key === "texture" || key === "trailTexture") {
      if (
        typeof value !== "string" ||
        value.length > 7_000_000 ||
        (value &&
          !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value))
      )
        throw new Error("纹理必须是内嵌的 PNG、JPG 或 WebP");
      c[key] = value;
    } else if (
      key.startsWith("color") ||
      ["trailStart", "trailEnd"].includes(key)
    ) {
      if (typeof value !== "string" || !/^#[\da-f]{6}$/i.test(value))
        throw new Error("颜色格式无效");
      c[key] = value;
    } else if (typeof base[key] === "boolean") {
      if (typeof value !== "boolean") throw new Error(`无效的 ${key}`);
      c[key] = value;
    } else {
      const enums = {
        emitter: ["point", "circle", "rect", "line"],
        shape: ["glow", "dot", "star", "crystal", "leaf"],
        blend: ["lighter", "source-over"],
        trailBlend: ["lighter", "source-over"],
        easing: ["linear", "smooth", "in", "out"],
      };
      if (!enums[key]?.includes(value)) throw new Error(`无效的 ${key}`);
      c[key] = value;
    }
  }
  for (const prefix of ["life", "size", "speed", "rotation"])
    if (c[`${prefix}Min`] > c[`${prefix}Max`])
      throw new Error("最小值不能大于最大值");
  if (raw.view) {
    out.view.background = ["board", "dark", "light"].includes(
      raw.view.background,
    )
      ? raw.view.background
      : "board";
    out.view.zoom =
      typeof raw.view.zoom === "number" && Number.isFinite(raw.view.zoom)
        ? clamp(raw.view.zoom, 0.25, 2)
        : 1;
  }
  return out;
}
