import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getScatterPos, getTreePos } from '../constants';
import { easing } from 'maath';

// Custom Shader Material for Foliage
const FoliageMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uMix: { value: 0 },
    uColorBottom: { value: new THREE.Color('#2a0f35') }, // Dark Purple
    uColorTop: { value: new THREE.Color('#bd6dbd') },   // Soft Pink-Purple
  },
  vertexShader: `
    uniform float uTime;
    uniform float uMix;
    attribute vec3 aScatterPos;
    attribute vec3 aTreePos;
    attribute float aRandom;
    
    varying vec3 vColor;
    varying float vAlpha;
    varying float vBlink;

    void main() {
      // Interpolate position
      vec3 pos = mix(aScatterPos, aTreePos, uMix);

      // Breathing effect (vertical)
      float pulse = sin(uTime * 1.5 + aRandom * 10.0) * 0.05;
      pos.y += pulse;

      // Horizontal drift (wind-like)
      pos.x += sin(uTime * 0.5 + pos.y) * 0.02;
      pos.z += cos(uTime * 0.5 + pos.y) * 0.02;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      // Size attenuation
      gl_PointSize = (80.0 * aRandom + 20.0) * (1.0 / -mvPosition.z);

      // Pass color logic to fragment
      // Height based gradient
      float h = clamp(pos.y / 12.0, 0.0, 1.0);
      
      // Twinkle logic
      float twinkle = sin(uTime * 3.0 + aRandom * 50.0);
      vBlink = smoothstep(0.9, 1.0, twinkle);

      vColor = vec3(h); // We'll mix uniforms in fragment or here. Let's send h.
    }
  `,
  fragmentShader: `
    uniform vec3 uColorBottom;
    uniform vec3 uColorTop;
    varying vec3 vColor;
    varying float vBlink;

    void main() {
      // Circular particle
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float ll = length(xy);
      if(ll > 0.5) discard;

      // Soft edge
      float strength = pow(1.0 - ll * 2.0, 2.0);

      // Gradient color based on height
      vec3 finalColor = mix(uColorBottom, uColorTop, vColor.x);
      
      // Add blink (white add)
      finalColor += vec3(1.0) * vBlink * 0.8;

      gl_FragColor = vec4(finalColor, strength * 0.8);
    }
  `
};

interface FoliageProps {
  isTreeShape: boolean;
}

const Foliage: React.FC<FoliageProps> = ({ isTreeShape }) => {
  const count = 3000;
  const meshRef = useRef<THREE.Points>(null);
  
  // Generate attributes once
  const { positions, scatterPos, treePos, randoms } = useMemo(() => {
    const p = new Float32Array(count * 3);
    const s = new Float32Array(count * 3);
    const t = new Float32Array(count * 3);
    const r = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const sp = getScatterPos();
      const tp = getTreePos();

      s[i * 3] = sp.x; s[i * 3 + 1] = sp.y; s[i * 3 + 2] = sp.z;
      t[i * 3] = tp.x; t[i * 3 + 1] = tp.y; t[i * 3 + 2] = tp.z;
      
      // Initial pos (0,0,0) - shader handles actual placement via uMix
      p[i * 3] = 0; p[i * 3 + 1] = 0; p[i * 3 + 2] = 0;
      
      r[i] = Math.random();
    }
    return { positions: p, scatterPos: s, treePos: t, randoms: r };
  }, []);

  // Shader material ref
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  useFrame((state, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
      // Smooth damp transition for mix value
      // 0 = Scattered, 1 = Tree
      // Scatter speed (to 0) is faster (0.5), Assemble (to 1) is slower (1.0)
      const target = isTreeShape ? 1 : 0;
      const smoothTime = isTreeShape ? 1.0 : 0.5;
      
      easing.damp(
        shaderRef.current.uniforms.uMix, 
        'value', 
        target, 
        smoothTime, 
        delta
      );
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aScatterPos" count={count} array={scatterPos} itemSize={3} />
        <bufferAttribute attach="attributes-aTreePos" count={count} array={treePos} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        args={[FoliageMaterial]}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default Foliage;