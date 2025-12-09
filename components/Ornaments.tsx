/// <reference types="@react-three/fiber" />
import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getScatterPos, getTreePos, ORNAMENTS_CONFIG } from '../constants';
import { easing } from 'maath';

// Helper to create gift texture
const createGiftTexture = (color: string) => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#fff'; // Ribbon
    ctx.fillRect(54, 0, 20, 128); // Vertical
    ctx.fillRect(0, 54, 128, 20); // Horizontal
  }
  return new THREE.CanvasTexture(canvas);
};

interface OrnamentGroupProps {
  config: typeof ORNAMENTS_CONFIG[0];
  isTreeShape: boolean;
  texture?: THREE.Texture;
}

const OrnamentGroup: React.FC<OrnamentGroupProps> = ({ config, isTreeShape, texture }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { count, type, weight } = config;

  // Pre-calculate positions
  const data = useMemo(() => {
    const scatter = [];
    const tree = [];
    const randoms = [];

    for (let i = 0; i < count; i++) {
      scatter.push(getScatterPos());
      
      // Special distribution for gifts (bottom pile) vs others
      let tp;
      if (type === 'gift') {
         // Pile at bottom
         const r = 1.5 + Math.random() * 3.0;
         const theta = Math.random() * Math.PI * 2;
         tp = new THREE.Vector3(r * Math.cos(theta), 0.3 + Math.random(), r * Math.sin(theta));
      } else if (type === 'diamond') {
        // Middle layer
        const h = 3 + Math.random() * 6;
        const maxR = 3.8 * (1 - h / 12.5);
        const r = maxR; // On surface
        const theta = Math.random() * Math.PI * 2;
        tp = new THREE.Vector3(r * Math.cos(theta), h, r * Math.sin(theta));
      } else {
        // Standard cone surface
        tp = getTreePos(); 
        // Push to surface for ornaments
        const rCurrent = Math.sqrt(tp.x*tp.x + tp.z*tp.z);
        if (rCurrent > 0.1) {
            // Re-project to cone surface approx
            const h = tp.y;
            const maxR = 3.8 * (1 - h/12.5);
            const scale = maxR / rCurrent;
            tp.x *= scale;
            tp.z *= scale;
        }
      }
      tree.push(tp);
      randoms.push(Math.random());
    }
    return { scatter, tree, randoms };
  }, [count, type]);

  // Temp object for matrix updates
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // State to track current mix factor for this specific group (for clean refs)
  const mixRef = useRef({ value: 0 });

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const target = isTreeShape ? 1 : 0;
    const smoothTime = isTreeShape ? 1.0 : 0.5;
    
    // Damp the mix value
    easing.damp(mixRef.current, 'value', target, smoothTime, delta);
    const mixVal = mixRef.current.value;

    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const sPos = data.scatter[i];
      const tPos = data.tree[i];
      const rnd = data.randoms[i];

      // Interpolate Position
      dummy.position.lerpVectors(sPos, tPos, mixVal);

      // Add "Floating/Wave" effect when scattered
      // Weight determines how much they float
      if (mixVal < 0.99) {
         const wave = Math.sin(time * 0.5 + i) * weight * (1 - mixVal);
         dummy.position.y += wave;
         dummy.rotation.x = time * 0.2 * rnd;
         dummy.rotation.y = time * 0.3 * rnd;
      } else {
         // Stabilize rotation when in tree
         dummy.rotation.set(0,0,0);
      }

      // Scale transition (optional pop in/out effect logic could go here)
      // Just constant scale for now
      dummy.scale.setScalar(1);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  // Geometry & Material Selection
  let geometry;
  let material;

  if (type === 'bauble' || type === 'bauble-small' || type === 'light') {
    geometry = <sphereGeometry args={[config.size, 16, 16]} />;
  } else if (type === 'diamond') {
    geometry = <octahedronGeometry args={[config.size, 0]} />;
  } else if (type === 'gift') {
    geometry = <boxGeometry args={[config.size, config.size, config.size]} />;
  }

  if (type === 'light') {
     material = <meshStandardMaterial 
        color={config.color} 
        emissive={config.color} 
        emissiveIntensity={2.0} 
        toneMapped={false} 
     />;
  } else if (type === 'diamond') {
     material = <meshPhysicalMaterial 
        transmission={0.4} 
        thickness={1}
        roughness={0} 
        metalness={0.1} 
        clearcoat={1}
        color={config.color}
     />;
  } else if (type === 'gift') {
     // Textured material
     material = <meshStandardMaterial map={texture} color={config.color} roughness={0.6} />;
  } else {
     // Baubles
     material = <meshPhysicalMaterial 
        color={config.color} 
        metalness={0.9} 
        roughness={0.1} 
        clearcoat={1.0} 
     />;
  }

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {geometry}
      {material}
    </instancedMesh>
  );
};

// Star on top
const Star: React.FC<{ isTreeShape: boolean }> = ({ isTreeShape }) => {
    const starRef = useRef<THREE.Group>(null);
    const mixRef = useRef({ value: 0 });

    useFrame((state, delta) => {
        if(!starRef.current) return;
        const target = isTreeShape ? 1 : 0;
        easing.damp(mixRef.current, 'value', target, 1.0, delta);
        
        const val = mixRef.current.value;
        const time = state.clock.elapsedTime;

        // Tree Pos
        const tx = 0, ty = 12.2, tz = 0;
        // Scatter Pos (Random high up)
        const sx = Math.sin(time)*5; 
        const sy = 16 + Math.cos(time * 0.5)*2; 
        const sz = Math.cos(time)*5;

        starRef.current.position.set(
            THREE.MathUtils.lerp(sx, tx, val),
            THREE.MathUtils.lerp(sy, ty, val),
            THREE.MathUtils.lerp(sz, tz, val)
        );

        starRef.current.rotation.y += delta * 0.5;
        starRef.current.scale.setScalar(val); // Scale up when tree forms
    });

    const shape = useMemo(() => {
        const s = new THREE.Shape();
        const outer = 0.5; 
        const inner = 0.2;
        const pts = 5;
        for(let i=0; i<pts*2; i++) {
            const r = i%2 === 0 ? outer : inner;
            const a = (i/ (pts*2)) * Math.PI * 2;
            s.lineTo(Math.cos(a)*r, Math.sin(a)*r);
        }
        s.closePath();
        return s;
    }, []);

    const extrudeSettings = { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 };

    return (
        <group ref={starRef}>
            <mesh>
                <extrudeGeometry args={[shape, extrudeSettings]} />
                <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={5} toneMapped={false} />
            </mesh>
            {/* Glow halo */}
            <pointLight distance={3} intensity={5} color="#ffd700" />
        </group>
    )
}

const Ornaments: React.FC<{ isTreeShape: boolean }> = ({ isTreeShape }) => {
  const giftTexture = useMemo(() => createGiftTexture('#ffffff'), []);

  return (
    <>
      <Star isTreeShape={isTreeShape} />
      {ORNAMENTS_CONFIG.map((conf, idx) => (
        <OrnamentGroup 
          key={idx} 
          config={conf} 
          isTreeShape={isTreeShape} 
          texture={conf.type === 'gift' ? giftTexture : undefined}
        />
      ))}
    </>
  );
};

export default Ornaments;