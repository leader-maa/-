import * as THREE from 'three';

// Colors - ARIX Signature Palette
export const COLORS = {
  bg: '#1a0b2e', // Deepest Purple
  primary: '#ffb6c1', // Light Pink
  secondary: '#da70d6', // Orchid
  accent: '#ffd700', // Gold
  highlight: '#e8d4e8', // Pale Lavender
  ambient: '#4b0082', // Indigo
};

// --- Texture Generator Helper ---
const createCardTexture = (icon: string, color: string, label?: string, isMystery = false) => {
  if (typeof document === 'undefined') return new THREE.Texture(); // SSR safety

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 600; 
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // 1. Background (Polaroid paper style)
    ctx.fillStyle = '#fdfbf7'; 
    ctx.fillRect(0, 0, 512, 600);
    
    // 2. Photo Area Background
    ctx.fillStyle = color;
    ctx.fillRect(30, 30, 452, 452);
    
    // 3. Inner Glow/Shadow
    const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 300);
    grad.addColorStop(0, 'rgba(255,255,255,0.2)');
    grad.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.fillStyle = grad;
    ctx.fillRect(30, 30, 452, 452);

    // 4. Icon / Emoji
    ctx.font = isMystery ? '150px serif' : '180px serif';
    ctx.fillStyle = '#1a0b2e';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 256, 256);
    
    // 5. Mystery Decoration
    if (isMystery) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(256, 256, 180, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // 6. Bottom Label (Optional)
    if (label) {
        ctx.font = '40px serif';
        ctx.fillStyle = '#555';
        ctx.fillText(label, 256, 550);
    } else {
        // Decorative lines if no label
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(50, 540);
        ctx.lineTo(462, 540);
        ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// --- Gift Logic ---
export interface GiftItem {
    name: string;
    value: number;
    weight: number;
    icon: string;
    texture: THREE.Texture; // Each gift now carries its own texture
}

// Raw data definitions
const RAW_GIFTS = [
  // High Value (Rare) - Gold/Yellow backgrounds
  { name: "iPad Pro", value: 3000, weight: 1, icon: "📱", color: "#fffacd" }, 
  { name: "名牌大衣", value: 1000, weight: 3, icon: "🧥", color: "#f0e68c" },
  
  // Mid Value - Pink/Purple backgrounds
  { name: "西太后围巾", value: 700, weight: 5, icon: "🧣", color: "#ffb6c1" },
  { name: "兰蔻套装", value: 550, weight: 8, icon: "💄", color: "#dda0dd" },
  
  // Lower Value (Common) - Blue/Cyan backgrounds
  { name: "Jellycat 玩偶", value: 300, weight: 15, icon: "🧸", color: "#e0ffff" },
  { name: "身体乳", value: 290, weight: 20, icon: "🧴", color: "#afeeee" },
  
  // Entry Value (Very Common) - Greenish/Neutral
  { name: "家居服 & 拖鞋", value: 200, weight: 25, icon: "👚", color: "#f0fff0" },
  { name: "现金 ¥188", value: 188, weight: 30, icon: "🧧", color: "#ffe4b5" },
  { name: "办公室午休床", value: 120, weight: 35, icon: "🛏️", color: "#f5f5dc" },
  
  // Special
  { name: "再接再厉", value: 0, weight: 12, icon: "💫", color: "#dcdcdc" } 
];

// Initialize Registry with Textures
export const GIFT_REGISTRY: GiftItem[] = RAW_GIFTS.map(g => ({
    ...g,
    // FIX: Do not pass the name (g.name) here. 
    // This prevents the text from being baked into the texture image.
    // The name will solely be rendered by the 3D <Text> component overlay.
    texture: createCardTexture(g.icon, g.color) 
}));

// Pure Weighted Random Algorithm
export const getRandomGift = (): GiftItem => {
  const totalWeight = GIFT_REGISTRY.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of GIFT_REGISTRY) {
    if (random < item.weight) {
      return item;
    }
    random -= item.weight;
  }
  return GIFT_REGISTRY[GIFT_REGISTRY.length - 1];
};

// --- Mystery Cards (Initial State) ---
// We create a few variations of "Mystery" cards so the tree looks colorful before interaction
const MYSTERY_COLORS = ['#e6e6fa', '#ffe4e1', '#f0fff0', '#e0ffff', '#fffacd'];
const MYSTERY_ICONS = ['🎁', '✨', '🎄', '⭐', '🎀'];

export const MYSTERY_TEXTURES = MYSTERY_COLORS.map((col, i) => 
    createCardTexture(MYSTERY_ICONS[i % MYSTERY_ICONS.length], col, "???", true)
);

// Math Helpers for Distributions
export const getScatterPos = () => {
  const r = 14 * Math.cbrt(Math.random());
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta) + 6; 
  const z = r * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

export const getTreePos = (forceBottom = false) => {
  const hNorm = 1 - Math.cbrt(Math.random());
  let h = 12 * hNorm;
  if (forceBottom || Math.random() < 0.08) {
    h = 0.2 * Math.random(); 
  }
  const maxR = 3.8 * (1 - h / 12.5);
  const r = maxR * Math.sqrt(Math.random()); 
  const theta = Math.random() * Math.PI * 2;
  const x = r * Math.cos(theta);
  const y = h; 
  const z = r * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
};

export const ORNAMENTS_CONFIG = [
  { type: 'bauble', count: 1200, size: 0.15, weight: 0.6, color: COLORS.primary },
  { type: 'bauble-small', count: 800, size: 0.08, weight: 0.8, color: COLORS.secondary },
  { type: 'diamond', count: 50, size: 0.2, weight: 0.5, color: '#ffffff' }, 
  { type: 'gift', count: 30, size: 0.3, weight: 0.3, color: COLORS.accent },
  { type: 'light', count: 400, size: 0.08, weight: 0.9, color: '#fffacd' }, 
];
