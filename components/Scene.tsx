import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera, BakeShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { CineonToneMapping } from 'three';
import * as THREE from 'three';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import { BackgroundParticles, Floor } from './Background';
import ImageGallery from './ImageGallery';
import { COLORS } from '../constants';

interface SceneProps {
  isTreeShape: boolean;
  rotationSpeed: number;
  isPinching: boolean;
}

const InnerScene: React.FC<{ rotationSpeed: number, isTreeShape: boolean, isPinching: boolean }> = ({ rotationSpeed, isTreeShape, isPinching }) => {
    const groupRef = useRef<THREE.Group>(null);
    
    useFrame((_, delta) => {
        if (groupRef.current) {
            // If pinching, we stop rotation to allow focusing on the image
            if (isPinching) {
                return;
            }

            // Apply gesture rotation with a reduced multiplier for a "heavy", slow feel
            if (Math.abs(rotationSpeed) > 0.001) {
                const finalDelta = rotationSpeed * 1.0; 
                groupRef.current.rotation.y += finalDelta * delta;
            } else {
                // Auto rotate slowly if idle
                groupRef.current.rotation.y += 0.1 * delta;
            }
        }
    });

    return (
        <group ref={groupRef}>
            <Foliage isTreeShape={isTreeShape} />
            <Ornaments isTreeShape={isTreeShape} />
            <ImageGallery isTreeShape={isTreeShape} isPinching={isPinching} />
            <Floor isTreeShape={isTreeShape} />
            <BackgroundParticles />
        </group>
    )
}

const Scene: React.FC<SceneProps> = ({ isTreeShape, rotationSpeed, isPinching }) => {
  return (
    <Canvas
      dpr={[1, 1]} // Fixed to 1 for maximum stability on all devices
      gl={{ 
        toneMapping: CineonToneMapping, 
        toneMappingExposure: 1.0,
        antialias: false,
        stencil: false,
        depth: true
      }}
    >
      <color attach="background" args={[COLORS.bg]} />
      
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 4, 18]} fov={50} />
      
      {/* Fallback Mouse Controls (Enabled if Gesture fails/Idle) */}
      <OrbitControls 
        target={[0, 5, 0]} 
        minDistance={5} 
        maxDistance={35} 
        enablePan={false}
        maxPolarAngle={Math.PI / 1.8} 
        enableRotate={true} 
        enableZoom={true} 
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} color={COLORS.ambient} />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={2.0} 
        color={COLORS.primary} 
      />
      <pointLight position={[-10, 5, -10]} intensity={1.0} color={COLORS.secondary} />
      <spotLight position={[0, 10, -15]} intensity={1.5} color={COLORS.highlight} />

      <InnerScene rotationSpeed={rotationSpeed} isTreeShape={isTreeShape} isPinching={isPinching} />

      {/* Post Processing - Simplified for stability */}
      {/* multisampling={0} helps prevent Framebuffer incomplete errors on some GPUs */}
      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom 
          luminanceThreshold={0.85} 
          intensity={1.0} 
          radius={0.5} 
          mipmapBlur 
        />
        <Noise opacity={0.05} />
        <Vignette offset={0.1} darkness={0.6} />
      </EffectComposer>
      
      <Environment preset="city" background={false} blur={0.8} />
    </Canvas>
  );
};

export default Scene;