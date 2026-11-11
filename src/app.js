import {
  presets,
  newProject,
  fields,
  setNumber,
  parseProject,
  clamp,
} from "./model.js";
import { ParticleEngine } from "./engine.js";
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icons = {
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3v.1"/>',
  folder: '<path d="M3 7V4h6l2 3h10v13H3zM3 10h18"/>',
  history: '<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7m2-5v7l4 2"/>',
  reset: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
  save: '<path d="M4 3h14l3 3v15H3V3zM7 3v6h10V3M7 21v-8h10v8"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  chevron: '<path d="m8 10 4 4 4-4"/>',
  file: '<path d="M5 3h10l4 4v14H5zM14 3v5h5M9 12h6m-6 4h6"/>',
  code: '<path d="m7 7-5 5 5 5m10-10 5 5-5 5m-3-14-4 18"/>',
  image:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1"/><path d="m3 18 6-6 4 4 3-3 5 5"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m8 4 12 8-12 8z"/>',
  path: '<path d="M6 5h10a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8h10"/><circle cx="5" cy="5" r="2"/>',
  pointer: '<path d="m4 3 6 18 3-8 8-3z"/>',
  nodes:
    '<circle cx="5" cy="5" r="3"/><circle cx="19" cy="19" r="3"/><path d="M8 5h8a4 4 0 0 1 0 8H8a4 4 0 0 0 0 8h8"/>',
  emit: '<path d="M4 17a9 9 0 1 1 16 0M12 13l5-6"/><circle cx="12" cy="13" r="1"/>',
  appearance: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/>',
  motion: '<path d="m5 19 14-14M11 5h8v8"/>',
  trail:
    '<path d="M2 6c4-5 6 5 10 0s6 5 10 0M2 12c4-5 6 5 10 0s6 5 10 0M2 18c4-5 6 5 10 0s6 5 10 0"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.file}</svg>`;
document
  .querySelectorAll("[data-icon]")
  .forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
let project = newProject(),
  tab = "emit",
  dirty = false,
  savedId = null,
  textureTarget = "texture",
  toastTimer;
const storeKey = "happy-trail-projects-v1",
  versionsKey = "happy-trail-versions-v1";
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 3500);
}
function changed() {
  dirty = true;
  $("#save-status").textContent = "未保存";
}
function readStore(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    if (!Array.isArray(value)) throw new Error();
    return value;
  } catch {
    toast("本地存储无法读取，请导出文件保留项目");
    return null;
  }
}
function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    toast("浏览器存储空间不足，请导出完整项目文件");
    return false;
  }
}
const engine = new ParticleEngine(
  $("#preview"),
  () => project,
  (p, t, fps) => {
    $("#particle-count").textContent = p;
    $("#trail-count").textContent = t;
    $("#fps").textContent = fps;
  },
);
function section(title, hint, content) {
  return `<section class="parameter-section"><div class="section-title"><h3>${title}</h3><small>${hint}</small></div>${content}</section>`;
}
function number(key, label, unit = "", hint = "") {
  const [min, max, step] = fields[key],
    value = project.config[key];
  return `<div class="parameter"><div class="parameter-top"><label for="number-${key}">${label}${hint ? `<small>${hint}</small>` : ""}</label><div class="number-wrap"><input id="number-${key}" aria-label="${label}数值" data-number="${key}" type="number" min="${min}" max="${max}" step="${step}" value="${value}"/><span>${unit}</span></div></div><input type="range" aria-label="${label}滑块" data-number="${key}" min="${min}" max="${max}" step="${step}" value="${value}" style="--progress:${((value - min) / (max - min)) * 100}%"/></div>`;
}
function toggle(key, label, hint = "") {
  return `<label class="toggle-row"><span>${label}<small>${hint}</small></span><input type="checkbox" role="switch" data-boolean="${key}" ${project.config[key] ? "checked" : ""}/><span class="switch"></span></label>`;
}
function select(key, label, options, hint = "") {
  return `<div class="select-row"><label for="select-${key}">${label}<small>${hint}</small></label><select id="select-${key}" aria-label="${label}" data-select="${key}">${options.map(([v, l]) => `<option value="${v}" ${project.config[key] === v ? "selected" : ""}>${l}</option>`).join("")}</select></div>`;
}
function colors(keys, labels) {
  return `<div class="color-row">${keys.map((k, i) => `<label>${labels[i]}<span class="color-input"><input type="color" data-color="${k}" value="${project.config[k]}" aria-label="${labels[i]}"/><code>${project.config[k].toUpperCase()}</code></span></label>`).join("")}</div><div class="gradient" style="background:linear-gradient(90deg,${keys.map((k) => project.config[k]).join(",")})"></div>`;
}
function upload(key, label) {
  return `<button class="upload" data-upload="${key}">${project.config[key] ? `<img src="${project.config[key]}" alt="${label}纹理"/>` : icon("image")}<strong>${project.config[key] ? "更换" : "上传自定义"}${label}素材</strong><span>点击或拖入 PNG、JPG、WebP</span><small>最大 5 MB · 自动缩放至 256 px</small></button>${project.config[key] ? `<button class="text-button danger" data-remove-texture="${key}">移除自定义纹理</button>` : ""}`;
}
function curve(key, label) {
  const points = project.config[key];
  return `<div class="curve-editor" data-curve="${key}"><div class="curve-heading"><span>${label}</span><small>双击添加 · 拖动调整 · 右键删除</small></div><svg viewBox="0 0 280 120" role="img" aria-label="${label}变化曲线"><path class="curve-grid" d="M10 10H270M10 35H270M10 60H270M10 85H270M10 110H270M10 10V110M75 10V110M140 10V110M205 10V110M270 10V110"/><polyline points="${points.map(([t, v]) => `${10 + t * 260},${110 - v * 100}`).join(" ")}"/>${points.map(([t, v], i) => `<circle cx="${10 + t * 260}" cy="${110 - v * 100}" r="4" data-point="${i}"/>`).join("")}</svg><div class="curve-values">${points.map(([t, v], i) => `<label title="t = ${t.toFixed(2)}">${t.toFixed(2)}<input type="number" min="0" max="1" step=".01" value="${v}" data-curve-value="${key}" data-index="${i}" aria-label="${label}关键帧${i + 1}值"/></label>`).join("")}</div><div class="curve-presets"><button data-curve-preset="${key}" data-kind="pop">弹出</button><button data-curve-preset="${key}" data-kind="fade">收束</button><button data-curve-preset="${key}" data-kind="soft">柔入</button><button data-curve-preset="${key}" data-kind="constant">恒定</button></div></div>`;
}
const blends = [
  ["lighter", "加法混合（发光）"],
  ["source-over", "Alpha 混合（普通透明）"],
];
function renderParameters() {
  const c = project.config;
  $("#tabs").innerHTML = [
    ["emit", "发射"],
    ["appearance", "外观"],
    ["motion", "运动"],
    ["trail", "拖尾"],
    ["path", "轨迹"],
  ]
    .map(
      ([key, label]) =>
        `<button data-tab="${key}" class="${key === tab ? "active" : ""}" aria-pressed="${key === tab}">${icon(key)}${label}</button>`,
    )
    .join("");
  let html = "";
  if (tab === "emit")
    html =
      section(
        "发射器形状",
        "粒子生成位置",
        `<div class="segments emitter">${[
          ["point", "⊙ 点"],
          ["circle", "◯ 圆"],
          ["rect", "□ 矩形"],
          ["line", "— 线"],
        ]
          .map(
            ([v, l]) =>
              `<button data-emitter="${v}" class="${v === c.emitter ? "selected" : ""}" aria-pressed="${v === c.emitter}">${l}</button>`,
          )
          .join(
            "",
          )}</div>${c.emitter === "circle" ? number("radius", "发射半径", "px", "圆形区域的大小") + number("arc", "发射弧角", "°", "360° 为整圆") + number("arcDirection", "弧形方向", "°", "0° 向右 · 90° 向上") + toggle("edge", "仅从边缘发射", "关闭时填充整个圆形区域") : ""}${["rect", "line"].includes(c.emitter) ? number("emitterWidth", "发射宽度", "px") : ""}${c.emitter === "rect" ? number("emitterHeight", "发射高度", "px") : ""}`,
      ) +
      section(
        "粒子发射",
        "数量与密度",
        number("maxParticles", "最大粒子数", "个", "同时存在的粒子上限") +
          number(
            "moveRate",
            "移动发射",
            "个/100px",
            "每移动 100 px 产生的粒子数",
          ) +
          number("rate", "持续发射", "个/秒", "发射器静止时也会持续产生") +
          number("burst", "启动爆发", "个", "开始播放时一次性产生"),
      ) +
      section(
        "粒子生命周期",
        "随机取值范围",
        `<div class="pair">${number("lifeMin", "最小值", "秒")}${number("lifeMax", "最大值", "秒")}</div>`,
      ) +
      section(
        "预览播放",
        "仅影响编辑器",
        number("previewSpeed", "预览速度", "×"),
      ) +
      section(
        "路径连续性",
        "防止瞬移拉线",
        number(
          "breakDistance",
          "瞬移断开距离",
          "px",
          "单次位移超过此值时开始新拖尾",
        ),
      );
  if (tab === "appearance")
    html =
      section("粒子纹理", "自定义图片", upload("texture", "粒子")) +
      section(
        "初始外观",
        "粒子出生时参数",
        select(
          "shape",
          "粒子形状",
          [
            ["glow", "柔光"],
            ["dot", "圆点"],
            ["star", "星芒"],
            ["crystal", "冰晶"],
            ["leaf", "叶片"],
          ],
          "自定义纹理优先",
        ) +
          number("sizeMin", "最小大小", "px") +
          number("sizeMax", "最大大小", "px") +
          select("blend", "混合模式", blends),
      ) +
      section(
        "颜色随生命周期",
        "出生到消散",
        colors(
          ["colorStart", "colorMid", "colorEnd"],
          ["起始颜色", "中段颜色", "结束颜色"],
        ),
      ) +
      section("大小随生命周期", "初始大小倍率", curve("sizeCurve", "大小")) +
      section(
        "透明度随生命周期",
        "1 不透明 · 0 透明",
        curve("alphaCurve", "透明度"),
      );
  if (tab === "motion")
    html =
      section(
        "初始速度",
        "随机取值范围",
        `<div class="pair">${number("speedMin", "最小值", "px/秒")}${number("speedMax", "最大值", "px/秒")}</div>`,
      ) +
      section(
        "发射方向",
        "粒子出生方向",
        number("direction", "中心方向", "°", "0° 向右 · 90° 向上") +
          number("spread", "方向扩散角", "°", "0° 集中 · 360° 全方向") +
          number("inherit", "继承发射器速度", "%", "0% 不继承 · 100% 完全继承"),
      ) +
      section(
        "持续受力",
        "X 向右 · Y 向上",
        number("gravityX", "重力 X", "px/秒²") +
          number("gravityY", "重力 Y", "px/秒²") +
          number("drag", "阻力", "/秒", "数值越大，速度衰减越快"),
      ) +
      section(
        "旋转速度",
        "正负表示相反方向",
        `<div class="pair">${number("rotationMin", "最小值", "°/秒")}${number("rotationMax", "最大值", "°/秒")}</div>`,
      );
  if (tab === "trail")
    html =
      section(
        "拖尾基础",
        "形状与性能",
        toggle("trailEnabled", "启用拖尾", "沿发射器移动路径生成") +
          number("trailLife", "持续时间", "秒", "拖尾点保留的时间") +
          number("trailWidth", "基础宽度", "px", "还会乘以宽度曲线") +
          number("spacing", "采样间距", "px", "越小越平滑，节点也越多") +
          number("maxNodes", "最大节点数", "个", "限制拖尾几何复杂度") +
          select("trailBlend", "混合模式", blends),
      ) +
      section("拖尾纹理", "沿轨迹分段映射", upload("trailTexture", "拖尾")) +
      section(
        "拖尾颜色",
        "头部到尾部",
        colors(["trailStart", "trailEnd"], ["头部", "尾部"]),
      ) +
      section(
        "宽度随生命周期",
        "头部到消散",
        curve("trailWidthCurve", "拖尾宽度"),
      ) +
      section(
        "透明度随生命周期",
        "头部到消散",
        curve("trailAlphaCurve", "拖尾透明度"),
      );
  if (tab === "path")
    html =
      section(
        "播放",
        `${c.anchors.length} 个锚点`,
        toggle("pathEnabled", "启用轨迹", "自动路径按锚点播放") +
          number("duration", "轨迹时长", "秒", "从起点移动到终点") +
          toggle("loop", "循环播放", "开放路径循环时自动断开拖尾") +
          toggle("closed", "闭合路径", "将最后一个锚点连接回起点"),
      ) +
      section(
        "运动节奏",
        "时间到路径进度",
        select("easing", "节奏预设", [
          ["linear", "匀速"],
          ["smooth", "缓入缓出"],
          ["in", "慢入快出"],
          ["out", "快入慢出"],
        ]) +
          `<div class="easing-preview"><svg viewBox="0 0 260 130"><path class="curve-grid" d="M10 10V120H250M10 65H250M130 10V120"/><path class="easing-line" d="${{ linear: "M10 120L250 10", smooth: "M10 120C110 120 150 10 250 10", in: "M10 120Q200 120 250 10", out: "M10 120Q60 10 250 10" }[c.easing]}"/></svg><span>时间 →</span></div>`,
      ) +
      section(
        "锚点",
        "路径结构",
        `<p class="muted">进入「轨迹编辑」后拖动锚点，双击画布添加。支持下方坐标精确编辑。</p><div class="anchor-list">${c.anchors.map(([x, y], i) => `<div class="anchor-row ${i === engine.selectedAnchor ? "selected" : ""}"><button data-anchor-select="${i}" aria-label="选中锚点${i + 1}">${i + 1}</button><label>X<input type="number" min="-10000" max="10000" step="1" data-anchor="${i}" data-axis="0" value="${Math.round(x)}" aria-label="锚点${i + 1} X"/></label><label>Y<input type="number" min="-10000" max="10000" step="1" data-anchor="${i}" data-axis="1" value="${Math.round(y)}" aria-label="锚点${i + 1} Y"/></label><button data-anchor-remove="${i}" aria-label="删除锚点${i + 1}" ${c.anchors.length <= 2 ? "disabled" : ""}>×</button></div>`).join("")}</div><button data-action="add-anchor">＋ 添加锚点</button>`,
      ) +
      section(
        "轨迹重置",
        "仅恢复路径",
        '<button data-action="reset-path">恢复默认轨迹</button>',
      );
  $("#parameters").innerHTML = html;
}
function renderPresets() {
  $("#preset-list").innerHTML = presets
    .map(
      (p) =>
        `<button class="preset ${project.preset === p.id ? "active" : ""}" data-preset="${p.id}" aria-pressed="${project.preset === p.id}"><span class="swatch" style="background:linear-gradient(90deg,${p.colors[0]} 33%,${p.colors[1]} 33%,${p.colors[1]} 66%,${p.colors[2]} 66%)"></span><span><strong>${p.name}</strong><small>${p.description}</small></span>${project.preset === p.id ? '<span class="check">✓</span>' : ""}</button>`,
    )
    .join("");
}
function render() {
  $("#project-name").value = project.name;
  $("#background").value = project.view.background;
  $("#zoom").value = project.view.zoom;
  $("#zoom-value").textContent = `${Math.round(project.view.zoom * 100)}%`;
  renderPresets();
  renderParameters();
}
function syncNumbers() {
  document.querySelectorAll("[data-number]").forEach((el) => {
    const k = el.dataset.number;
    if (el !== document.activeElement) el.value = project.config[k];
    if (el.type === "range")
      el.style.setProperty(
        "--progress",
        `${((project.config[k] - fields[k][0]) / (fields[k][1] - fields[k][0])) * 100}%`,
      );
  });
}
function setMode(mode) {
  engine.mode = mode;
  engine.reset();
  document.querySelectorAll("[data-mode]").forEach((b) => {
    b.classList.toggle("selected", b.dataset.mode === mode);
    b.setAttribute("aria-pressed", b.dataset.mode === mode);
  });
  $("#stage-hint").hidden = mode === "auto";
  $("#stage-hint").textContent =
    mode === "draw"
      ? "按住鼠标或触控笔，在画布中绘制粒子轨迹"
      : "拖动锚点调整轨迹 · 双击添加锚点 · Delete 删除选中锚点";
  $("#preview").style.cursor = mode === "auto" ? "default" : "crosshair";
  if (mode === "edit") {
    tab = "path";
    renderParameters();
  }
}
function syncPlayback() {
  const b = $('[data-action="pause"]');
  b.innerHTML = icon(engine.paused ? "play" : "pause");
  b.setAttribute("aria-label", engine.paused ? "播放预览" : "暂停预览");
  $("#live-label").textContent = engine.paused ? "PAUSED" : "LIVE";
  $(".live-dot").classList.toggle("paused", engine.paused);
}
function modal(title, html) {
  $("#dialog-title").textContent = title;
  $("#dialog-body").innerHTML = html;
  if (!$("#dialog").open) $("#dialog").showModal();
}
function confirmReplace(next) {
  if (!dirty) return next();
  modal(
    "保留当前修改？",
    '<p>当前项目有未保存的修改。可以先保存，再切换到新的效果。</p><div class="dialog-actions"><button id="discard">放弃修改并继续</button><button id="save-continue" class="primary">保存并继续</button></div>',
  );
  $("#discard").onclick = () => {
    $("#dialog").close();
    next();
  };
  $("#save-continue").onclick = () => {
    if (save()) {
      $("#dialog").close();
      next();
    }
  };
}
function load(p, id = null) {
  project = p;
  savedId = id;
  dirty = false;
  $("#save-status").textContent = id ? "已保存" : "未保存";
  engine.selectedAnchor = 0;
  engine.reset();
  render();
}
function save() {
  project.name = $("#project-name").value.trim() || "未命名效果";
  const list = readStore(storeKey);
  if (!list) return false;
  const id = savedId || crypto.randomUUID();
  const item = {
    id,
    updated: new Date().toISOString(),
    project: structuredClone(project),
  };
  const index = list.findIndex((p) => p.id === id);
  if (index >= 0) list[index] = item;
  else list.unshift(item);
  if (!writeStore(storeKey, list)) return false;
  savedId = id;
  dirty = false;
  $("#project-name").value = project.name;
  $("#save-status").textContent = "已保存到本机";
  toast("项目已保存到当前浏览器");
  return true;
}
function projectsModal() {
  const list = readStore(storeKey);
  if (!list) return;
  modal(
    "我的项目",
    '<p class="muted">项目保存在当前浏览器。跨设备使用或清理缓存前，请导出完整项目文件。</p>' +
      (list.length
        ? `<div class="saved-list">${list.map((item) => `<div><span><strong>${esc(item.project?.name || "未命名")}</strong><small>${esc(new Date(item.updated).toLocaleString("zh-CN"))}</small></span><button data-load="${esc(item.id)}">打开</button></div>`).join("")}</div>`
        : '<div class="empty-state">还没有保存的项目<br><small>调整效果后，点击右上角「保存」</small></div>'),
  );
}
function versionsModal() {
  const list = readStore(versionsKey);
  if (!list) return;
  modal(
    "版本管理",
    '<p class="muted">创建当前效果的快照，可随时恢复。版本保存在当前浏览器，最多保留 30 个。</p><button class="primary" data-action="create-version">＋ 创建当前版本</button>' +
      `<div class="saved-list">${list.map((v) => `<div><span><strong>${esc(v.project?.name || "未命名")}</strong><small>${esc(new Date(v.updated).toLocaleString("zh-CN"))}</small></span><button data-restore="${esc(v.id)}">恢复</button></div>`).join("") || '<div class="empty-state">暂无版本</div>'}</div>`,
  );
}
function download(content, filename, type) {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function addAnchor(p) {
  if (project.config.anchors.length >= 100) return toast("最多支持 100 个锚点");
  project.config.anchors.push(
    p || [
      project.config.anchors.at(-1)[0] + 60,
      project.config.anchors.at(-1)[1],
    ],
  );
  engine.selectedAnchor = project.config.anchors.length - 1;
  changed();
  renderParameters();
}
function removeAnchor(i) {
  if (project.config.anchors.length <= 2) return toast("轨迹至少需要两个锚点");
  project.config.anchors.splice(i, 1);
  engine.selectedAnchor = Math.min(i, project.config.anchors.length - 1);
  changed();
  renderParameters();
}
const actions = {
  pause() {
    engine.paused = !engine.paused;
    syncPlayback();
  },
  restart() {
    engine.reset();
    engine.paused = false;
    syncPlayback();
  },
  save,
  help() {
    modal(
      "使用说明",
      '<div class="help-content"><h3>从一个预设开始</h3><p>左侧选择效果，右侧五个分类调整参数。所有参数会实时更新预览，新生粒子使用新的初始参数。</p><h3>控制预览与轨迹</h3><p>空格暂停 / 播放，R 从头播放。手绘模式下按住画布绘制；轨迹编辑模式下拖动锚点、双击添加，选中后按 Delete 删除。</p><h3>编辑生命周期曲线</h3><p>拖动曲线关键帧调整时间与数值，双击添加，右键删除内部关键帧。也可通过下方数值框精确修改。</p><h3>保存你的作品</h3><p>Ctrl / ⌘ + S 保存至当前浏览器；「版本」保存效果快照。「导出 → 完整项目文件」可备份纹理和全部参数，再通过「导入」恢复。</p><h3>文件格式</h3><p>本地项目使用 happy-trail-project v1 格式。效果参数 JSON 使用本工程的配置结构，尚未接入 Cocos / Unity 运行时适配器。</p></div>',
    );
  },
  projects: projectsModal,
  versions: versionsModal,
  "close-dialog"() {
    $("#dialog").close();
  },
  reset() {
    confirmReplace(() => {
      load(newProject(project.preset));
      changed();
      toast("已恢复当前预设");
    });
  },
  import() {
    $("#import-file").click();
  },
  "export-menu"() {
    const menu = $("#export-menu");
    menu.hidden = !menu.hidden;
    $('[data-action="export-menu"]').setAttribute(
      "aria-expanded",
      !menu.hidden,
    );
  },
  "export-project"() {
    download(
      JSON.stringify(project, null, 2),
      `${project.name}.trail.json`,
      "application/json",
    );
    toast("已导出完整项目");
  },
  "export-runtime"() {
    const config = structuredClone(project.config);
    delete config.previewSpeed;
    download(
      JSON.stringify(
        {
          format: "happy-trail-effect",
          version: 1,
          name: project.name,
          config,
        },
        null,
        2,
      ),
      `${project.name}.effect.json`,
      "application/json",
    );
    toast("已导出效果参数");
  },
  screenshot() {
    engine.render();
    $("#preview").toBlob((blob) => {
      if (blob) download(blob, `${project.name}.png`, "image/png");
      else toast("截图失败，请重试");
    });
  },
  "create-version"() {
    const list = readStore(versionsKey);
    if (!list) return;
    list.unshift({
      id: crypto.randomUUID(),
      updated: new Date().toISOString(),
      project: structuredClone(project),
    });
    if (writeStore(versionsKey, list.slice(0, 30))) {
      versionsModal();
      toast("已创建版本快照");
    }
  },
  "add-anchor"() {
    addAnchor();
  },
  "reset-path"() {
    project.config.anchors = newProject(project.preset).config.anchors;
    engine.selectedAnchor = 0;
    engine.reset();
    changed();
    renderParameters();
  },
};
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!e.target.closest(".export-wrap")) {
    $("#export-menu").hidden = true;
    $('[data-action="export-menu"]').setAttribute("aria-expanded", "false");
  }
  if (!b) return;
  const d = b.dataset;
  if (d.action && actions[d.action]) {
    actions[d.action]();
    if (d.action !== "export-menu") $("#export-menu").hidden = true;
  }
  if (d.preset) confirmReplace(() => load(newProject(d.preset)));
  if (d.tab) {
    tab = d.tab;
    renderParameters();
    $("#parameters").scrollTop = 0;
  }
  if (d.mode) setMode(d.mode);
  if (d.emitter) {
    project.config.emitter = d.emitter;
    changed();
    renderParameters();
  }
  if (d.upload) {
    textureTarget = d.upload;
    $("#texture-file").click();
  }
  if (d.removeTexture) {
    project.config[d.removeTexture] = "";
    changed();
    renderParameters();
  }
  if (d.curvePreset) {
    project.config[d.curvePreset] = structuredClone(
      {
        pop: [
          [0, 0.2],
          [0.2, 1],
          [1, 0],
        ],
        fade: [
          [0, 1],
          [1, 0],
        ],
        soft: [
          [0, 0],
          [0.3, 1],
          [1, 0],
        ],
        constant: [
          [0, 1],
          [1, 1],
        ],
      }[d.kind],
    );
    changed();
    renderParameters();
  }
  if (d.anchorSelect !== undefined) {
    engine.selectedAnchor = Number(d.anchorSelect);
    setMode("edit");
  }
  if (d.anchorRemove !== undefined) removeAnchor(Number(d.anchorRemove));
  if (d.load || d.restore) {
    const item = readStore(d.load ? storeKey : versionsKey)?.find(
      (v) => v.id === (d.load || d.restore),
    );
    if (item) {
      try {
        const parsed = parseProject(item.project);
        confirmReplace(() => {
          load(parsed, d.load || null);
          if (d.restore) changed();
          $("#dialog").close();
          toast(d.restore ? "已恢复版本" : "已打开项目");
        });
      } catch (err) {
        toast(err.message);
      }
    }
  }
});
$("#parameters").addEventListener("input", (e) => {
  const el = e.target,
    d = el.dataset;
  if (d.number) {
    if (setNumber(project.config, d.number, el.value)) {
      changed();
      syncNumbers();
    }
  }
  if (d.color) {
    project.config[d.color] = el.value;
    el.nextElementSibling.textContent = el.value.toUpperCase();
    const section = el.closest("section"),
      colors = [...section.querySelectorAll('[type="color"]')].map(
        (e) => e.value,
      );
    section.querySelector(".gradient").style.background =
      `linear-gradient(90deg,${colors})`;
    changed();
  }
  if (d.curveValue && el.value !== "" && Number.isFinite(el.valueAsNumber)) {
    project.config[d.curveValue][Number(d.index)][1] = clamp(
      el.valueAsNumber,
      0,
      1,
    );
    changed();
    updateCurve(el.closest(".curve-editor"));
  }
  if (
    d.anchor !== undefined &&
    el.value !== "" &&
    Number.isFinite(el.valueAsNumber)
  ) {
    project.config.anchors[Number(d.anchor)][Number(d.axis)] = clamp(
      el.valueAsNumber,
      -10000,
      10000,
    );
    changed();
  }
});
$("#parameters").addEventListener("change", (e) => {
  const el = e.target,
    d = el.dataset;
  if (d.number) {
    el.value = project.config[d.number];
    syncNumbers();
  }
  if (d.boolean) {
    project.config[d.boolean] = el.checked;
    changed();
  }
  if (d.select) {
    project.config[d.select] = el.value;
    changed();
    if (d.select === "easing") renderParameters();
  }
});
$("#project-name").addEventListener("input", (e) => {
  project.name = e.target.value.trim() || "未命名效果";
  changed();
});
$("#background").addEventListener("change", (e) => {
  project.view.background = e.target.value;
  changed();
});
$("#zoom").addEventListener("input", (e) => {
  project.view.zoom = Number(e.target.value);
  $("#zoom-value").textContent = `${Math.round(project.view.zoom * 100)}%`;
  changed();
});
$("#import-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  try {
    if (file.size > 15_000_000) throw new Error("项目文件不能超过 15 MB");
    const parsed = parseProject(await file.text());
    confirmReplace(() => {
      load(parsed);
      changed();
      toast("项目导入成功");
    });
  } catch (err) {
    toast(`导入失败：${err.message}`);
  }
});
async function importTexture(file, key) {
  if (!file) return;
  try {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
      throw new Error("请选择 PNG、JPG 或 WebP 图片");
    if (file.size > 5 * 1024 * 1024) throw new Error("图片不能超过 5 MB");
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height)),
      canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas
      .getContext("2d")
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    project.config[key] = canvas.toDataURL("image/png");
    changed();
    renderParameters();
    toast("自定义纹理已应用");
  } catch (err) {
    toast(`纹理加载失败：${err.message}`);
  }
}
$("#texture-file").addEventListener("change", (e) => {
  importTexture(e.target.files[0], textureTarget);
  e.target.value = "";
});
$("#parameters").addEventListener("dragover", (e) => {
  if (e.target.closest("[data-upload]")) e.preventDefault();
});
$("#parameters").addEventListener("drop", (e) => {
  const target = e.target.closest("[data-upload]");
  if (target) {
    e.preventDefault();
    importTexture(e.dataTransfer.files[0], target.dataset.upload);
  }
});
let dragAnchor = null;
$("#preview").addEventListener("pointerdown", (e) => {
  if (e.button !== 0 || engine.mode === "auto") return;
  $("#preview").setPointerCapture(e.pointerId);
  engine.pointer = engine.world(e);
  if (engine.mode === "draw") {
    engine.previous = null;
    engine.trail = [];
    engine.started = false;
    engine.drawing = true;
  } else {
    const i = project.config.anchors.findIndex(
      (p) =>
        Math.hypot(p[0] - engine.pointer[0], p[1] - engine.pointer[1]) <
        16 / project.view.zoom,
    );
    if (i >= 0) {
      dragAnchor = i;
      engine.selectedAnchor = i;
      renderParameters();
    }
  }
});
$("#preview").addEventListener("pointermove", (e) => {
  engine.pointer = engine.world(e);
  if (dragAnchor !== null) {
    project.config.anchors[dragAnchor] = engine.pointer.map((n) =>
      clamp(n, -10000, 10000),
    );
    changed();
  }
});
function endPointer() {
  engine.drawing = false;
  if (dragAnchor !== null) {
    dragAnchor = null;
    renderParameters();
  }
}
$("#preview").addEventListener("pointerup", endPointer);
$("#preview").addEventListener("pointercancel", endPointer);
$("#preview").addEventListener("dblclick", (e) => {
  if (engine.mode === "edit")
    addAnchor(engine.world(e).map((n) => clamp(n, -10000, 10000)));
});
function updateCurve(editor) {
  const points = project.config[editor.dataset.curve];
  editor
    .querySelector("polyline")
    .setAttribute(
      "points",
      points.map(([t, v]) => `${10 + t * 260},${110 - v * 100}`).join(" "),
    );
  editor.querySelectorAll("circle").forEach((el, i) => {
    el.setAttribute("cx", 10 + points[i][0] * 260);
    el.setAttribute("cy", 110 - points[i][1] * 100);
  });
}
let curveDrag;
$("#parameters").addEventListener("pointerdown", (e) => {
  const p = e.target.closest("[data-point]");
  if (!p || e.button !== 0) return;
  const editor = p.closest("[data-curve]");
  curveDrag = { editor, index: Number(p.dataset.point) };
  p.setPointerCapture(e.pointerId);
  e.preventDefault();
});
$("#parameters").addEventListener("pointermove", (e) => {
  if (!curveDrag) return;
  const { editor, index } = curveDrag,
    svg = editor.querySelector("svg"),
    r = svg.getBoundingClientRect(),
    points = project.config[editor.dataset.curve];
  points[index][1] =
    Math.round(
      clamp((110 - ((e.clientY - r.top) / r.height) * 120) / 100, 0, 1) * 100,
    ) / 100;
  if (index > 0 && index < points.length - 1)
    points[index][0] = clamp(
      (((e.clientX - r.left) / r.width) * 280 - 10) / 260,
      points[index - 1][0] + 0.001,
      points[index + 1][0] - 0.001,
    );
  changed();
  updateCurve(editor);
});
$("#parameters").addEventListener("pointerup", () => {
  if (curveDrag) {
    curveDrag = null;
    renderParameters();
  }
});
$("#parameters").addEventListener("pointercancel", () => {
  curveDrag = null;
});
$("#parameters").addEventListener("dblclick", (e) => {
  const svg = e.target.closest(".curve-editor svg");
  if (!svg || e.target.matches("circle")) return;
  const key = svg.closest("[data-curve]").dataset.curve,
    points = project.config[key],
    r = svg.getBoundingClientRect(),
    t = clamp((((e.clientX - r.left) / r.width) * 280 - 10) / 260, 0.01, 0.99),
    v = clamp((110 - ((e.clientY - r.top) / r.height) * 120) / 100, 0, 1);
  if (points.length >= 16 || points.some((p) => Math.abs(p[0] - t) < 0.01))
    return;
  points.push([t, v]);
  points.sort((a, b) => a[0] - b[0]);
  changed();
  renderParameters();
});
$("#parameters").addEventListener("contextmenu", (e) => {
  const p = e.target.closest("[data-point]");
  if (!p) return;
  e.preventDefault();
  const key = p.closest("[data-curve]").dataset.curve,
    index = Number(p.dataset.point);
  if (index > 0 && index < project.config[key].length - 1) {
    project.config[key].splice(index, 1);
    changed();
    renderParameters();
  }
});
document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    save();
    return;
  }
  if (
    $("#dialog").open ||
    ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(e.target.tagName)
  )
    return;
  if (e.code === "Space") {
    e.preventDefault();
    actions.pause();
  }
  if (e.key.toLowerCase() === "r") actions.restart();
  if (e.key === "Delete" && engine.mode === "edit")
    removeAnchor(engine.selectedAnchor);
});
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
render();
syncPlayback();
