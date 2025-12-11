# 🎄 ARIX Signature Christmas Tree

![React](https://img.shields.io/badge/React-v19-61DAFB?style=flat-square&logo=react)
![Three.js](https://img.shields.io/badge/Three.js-R3F-black?style=flat-square&logo=three.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![MediaPipe](https://img.shields.io/badge/AI-MediaPipe-orange?style=flat-square&logo=google)
![Vite](https://img.shields.io/badge/Vite-Fast-646CFF?style=flat-square&logo=vite)

> **沉浸式 3D 圣诞体验** —— 融合 React 19、WebGL 粒子特效与 AI 手势识别的互动网页应用。

## ✨ 项目简介 (Introduction)

ARIX Signature Christmas Tree 是一个基于 Web 的 3D 交互式体验项目。它不仅仅是一棵圣诞树，更是一个结合了物理粒子系统、后期处理特效（Bloom/Noise）以及前沿 AI 视觉识别技术的数字艺术品。

用户可以通过**手势**与场景进行实时互动：控制粒子的聚合与消散、旋转视角，甚至通过捏合手势从树上“摘取”神秘礼物。

## 🚀 核心功能 (Features)

*   **⚛️ React 19 & R3F**: 采用最新的 React 生态系统与 React Three Fiber 构建高性能 3D 场景。
*   **🤖 AI 手势控制**: 集成 Google MediaPipe，实现无接触式交互（握拳组装、张手打散、捏合抽奖）。
*   **✨ 影院级视觉效果**: 包含辉光 (Bloom)、噪点 (Noise)、暗角 (Vignette) 等后期处理特效。
*   **🎁 抽奖系统 (Gacha)**: 内置加权随机算法的礼物系统，支持自定义奖品、概率和稀有度视觉反馈。
*   **🎨 动态粒子系统**: 3000+ 粒子在无序散射与有序树形之间流畅变形 (Morphing)。
*   **📱 响应式与容错**: 针对性能优化，支持 AI 降级模式（若摄像头不可用自动切换为鼠标交互）。

## 🛠️ 技术栈 (Tech Stack)

*   **Core**: React 19, TypeScript, Vite
*   **3D Engine**: Three.js, @react-three/fiber, @react-three/drei
*   **AI/CV**: @mediapipe/tasks-vision (Hand Landmarker)
*   **Animation**: Maath (Damp/Lerp physics)
*   **Styling**: Tailwind CSS

## 📦 快速开始 (Getting Started)

### 环境要求
*   Node.js > 16
*   支持 WebGL 的浏览器 (Chrome/Edge/Safari)
*   摄像头 (用于手势体验)

### 安装与运行

1.  **克隆项目**
    ```bash
    git clone https://github.com/your-username/arix-christmas-tree.git
    cd arix-christmas-tree
    ```

2.  **安装依赖**
    ```bash
    npm install
    # 或
    yarn install
    ```

3.  **启动开发服务器**
    ```bash
    npm run dev
    ```

4.  **打开浏览器**
    访问终端中显示的地址 (通常是 `http://localhost:5173`)。

## 🎮 操作指南 (User Manual)

确保允许浏览器访问摄像头权限以获得完整体验。

| 手势 / 操作 | 视觉反馈 | 功能描述 |
| :--- | :--- | :--- |
| **✊ 握拳 (Fist)** | 粒子聚合 | 将散落的粒子汇聚成一棵圣诞树。 |
| **🖐️ 张开手掌 (Open)** | 粒子消散 | 树体解体，粒子在空间中自由漂浮。 |
| **👋 手掌左右倾斜** | 视角旋转 | 像控制方向盘一样控制摄像机的旋转角度。 |
| **👌 捏合 (Pinch)** | **抽取礼物** | 瞄准树上的神秘卡片，捏合手指即可打开礼物！ |
| **🖱️ 鼠标拖拽** | 视角控制 | (AI 备用模式) 如果没有摄像头，可使用鼠标旋转场景。 |

## ⚙️ 自定义配置 (Configuration)

### 修改奖品与概率
所有奖品数据均位于 `constants.ts` 文件中。你可以修改 `RAW_GIFTS` 数组来定制你的礼物列表。

```typescript
// src/constants.ts

const RAW_GIFTS = [
  // name: 奖品名称
  // weight: 权重 (数字越大，抽中概率越高)
  // color: 卡片背景色
  { name: "iPad Pro", value: 3000, weight: 1, icon: "📱", color: "#fffacd" }, 
  { name: "现金红包", value: 188, weight: 30, icon: "🧧", color: "#ffe4b5" },
  // ... 添加更多
];
```

### 调整视觉参数
*   **配色**: 修改 `constants.ts` 中的 `COLORS` 对象。
*   **粒子数量**: 修改 `components/Foliage.tsx` 中的 `count` 变量。

## ⚠️ 常见问题 (Troubleshooting)

*   **白屏或崩溃?**
    *   本项目已针对 WebGL 上下文丢失做了防护 (MediaPipe 运行在 CPU 模式以避免 GPU 抢占)。
    *   请确保浏览器已启用硬件加速。
*   **摄像头无法开启?**
    *   请检查浏览器地址栏右侧是否拦截了摄像头权限。
    *   确保没有其他应用正在占用摄像头。

## 📄 License

MIT License © 2024 ARIX

---
*Created with ❤️ by ARIX Team*
