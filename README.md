# Happy Particle System

浏览器中的粒子与拖尾特效编辑器，参照 Trail Studio 的界面和交互独立实现。使用原生 JavaScript、Canvas 2D 和 CSS，无第三方运行依赖。

[![Deploy GitHub Pages](https://github.com/jwk000/happy-particle-system/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/jwk000/happy-particle-system/actions/workflows/deploy-pages.yml)

**[在线使用编辑器](https://jwk000.github.io/happy-particle-system/)** · [源码仓库](https://github.com/jwk000/happy-particle-system)

![编辑器预览](docs/editor-preview.jpg)

## 启动

需要 Node.js 22 或更新版本，无需执行 `npm install`。

```bash
git clone https://github.com/jwk000/happy-particle-system.git
cd happy-particle-system
npm run dev
```

打开 [本地编辑器](http://localhost:5173)。服务仅监听本机，默认端口为 5173；通过 `PORT=5174 npm run dev` 更换端口。

```bash
npm test
npm run build
```

构建产物位于 `dist/`，使用相对资源路径，可部署到静态 HTTP 服务的根路径或项目子目录。开发服务不提供热更新，修改源码后刷新页面。

## GitHub Pages 部署

源码与部署使用同一个公开仓库 `jwk000/happy-particle-system`，无需独立发布仓库或个人访问令牌。站点地址为 [https://jwk000.github.io/happy-particle-system/](https://jwk000.github.io/happy-particle-system/)。

推送到 `main` 分支后，[Deploy GitHub Pages 工作流](.github/workflows/deploy-pages.yml) 自动执行：

1. 使用 Node.js 22 运行 `npm test`。
2. 执行 `npm run build`，生成 `dist/`。
3. 上传 `dist/`，通过 GitHub Pages 发布站点。

测试或构建失败时不会执行发布，线上保留此前成功部署的版本。可以在仓库的 **Actions → Deploy GitHub Pages** 页面查看状态或通过 **Run workflow** 手动重试；仅 `main` 分支允许发布。

仓库 **Settings → Pages → Source** 设置为 **GitHub Actions** 。工作流只申请读取源码、写入 Pages 和签发部署身份令牌所需的权限，不需要配置额外 Secret。

只有 `dist/` 中的 HTML、CSS 和 JavaScript 部署到站点；源码仓库本身公开。本地预览与 Pages 地址属于不同来源，浏览器保存的项目不会自动迁移，需要通过 JSON 导出和导入转移。

## 已实现功能

- 三栏编辑器、五种场景预设、桌面与窄屏布局。
- Canvas 实时粒子与拖尾预览、棋盘 / 深浅网格、缩放、暂停和重播。
- 点、圆、矩形、线发射器；时间发射、距离发射、启动爆发和生命周期。
- 粒子形状、颜色渐变、混合模式、大小与透明度关键帧曲线。
- 初始速度、方向、扩散角、速度继承、重力、阻力和旋转。
- 拖尾宽度、生命周期、颜色、采样间距、节点数和独立混合模式。
- PNG、JPG、WebP 粒子 / 拖尾纹理导入，限制 5 MB，缩放至最长边 256 px。
- 自动路径、按住绘制、锚点拖动 / 增删 / 坐标编辑、闭合路径和四种节奏。
- 本地项目保存、最多 30 个版本快照、JSON 导入导出、PNG 截图。
- 未保存修改保护，导入文件格式和数值范围校验。

## 操作

| 操作 | 方式 |
| --- | --- |
| 暂停 / 播放 | 空格或预览工具栏 |
| 从头播放 | R 或重播按钮 |
| 保存项目 | Ctrl / Command + S |
| 手绘路径 | 切换「手绘路径」，按住画布绘制 |
| 调整锚点 | 切换「轨迹编辑」，拖动锚点或编辑坐标 |
| 新增锚点 | 双击画布或点击「添加锚点」 |
| 删除锚点 | 选中后按 Delete，或点击坐标行的删除按钮 |
| 编辑生命周期曲线 | 拖动关键帧、双击添加、右键删除内部关键帧；也可编辑数值 |

操作系统启用减少动态效果时，编辑器初始暂停，可手动播放。

## 文件与数据

「保存」及「版本」使用当前浏览器的 `localStorage`，不会上传服务器。清理站点数据会移除本地项目，因此跨设备使用或长期保留时应导出完整项目文件。

- `*.trail.json`：`happy-trail-project` v1，包含名称、预设、效果参数、内嵌纹理和预览设置。
- `*.effect.json`：`happy-trail-effect` v1，包含效果参数，排除预览速度；可以重新导入本编辑器。
- `*.png`：当前预览画布截图，包含预览背景。

## 源码

| 文件 | 职责 |
| --- | --- |
| `src/app.js` | 参数面板、交互、文件操作、本地保存和版本 |
| `src/engine.js` | 粒子模拟、拖尾和 Canvas 渲染 |
| `src/model.js` | 预设、参数边界、导入校验、曲线和路径计算 |
| `src/style.css` | 界面样式与响应式布局 |
| `tests/model.test.mjs` | 模型与模拟逻辑的自动测试 |
| `scripts/serve.mjs` | 本地静态开发服务 |
| `scripts/build.mjs` | 静态产物构建 |
| `.github/workflows/deploy-pages.yml` | 测试、构建与 GitHub Pages 自动部署 |

## 与参考站的差异

本实现依据可见界面和行为独立编写，未复用参考站源码，也未实现其全部运行时能力：

- 项目 JSON 使用本工程格式，不保证兼容参考站导出的文件。
- 尚未实现 Cocos TypeScript / Unity C# 适配器导出或引擎端播放验证。
- 路径使用 Catmull–Rom 插值和四种内置节奏，尚无自定义贝塞尔节奏控制点。
- 拖尾纹理按路径分段绘制，尚无整条纹理拉伸、旋转与平铺参数；预览会缩小纹理。
- Canvas 2D 混合和曲线插值是本地实现，不保证与原站或游戏渲染器逐像素一致。

## 验证

自动测试覆盖预设往返、恶意与越界导入、数值联动、曲线插值、路径端点与闭合、发射数量、帧率一致性、生命周期和受力。

浏览器人工操作验证包括预设切换、参数联动、暂停、保存、版本恢复、锚点编辑、外观曲线、背景切换和文件导出。已读取实际下载文件并确认编辑参数持久化。浏览器扩展未开放本地文件权限，因此自动化文件回填未完成；文件解析逻辑已通过测试。
