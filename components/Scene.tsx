/// <reference types="@react-three/fiber" />
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
                // Optional: Smooth stop could be added, but sudden stop is responsive for "holding" an object
                // We'll let the physics/damping in GestureController handle the input speed, 
                // but we explicitly ignore rotation application here if pinching.
                return;
            }

            // Apply gesture rotation with a reduced multiplier for a "heavy", slow feel
            if (Math.abs(rotationSpeed) > 0.001) {
                const finalDelta = rotationSpeed * 1.0; 
                groupRef.current.rotation.y += finalDelta * delta;
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
      dpr={[1, 2]} // Quality scaling
      gl={{ 
        toneMapping: CineonToneMapping, 
        toneMappingExposure: 1.1,
        antialias: false // Let Postprocessing handle AA if needed, or off for performance with bloom
      }}
    >
      <color attach="background" args={[COLORS.bg]} />
      
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 4, 18]} fov={50} />
      <OrbitControls 
        target={[0, 5, 0]} 
        minDistance={5} 
        maxDistance={35} 
        enablePan={false}
        maxPolarAngle={Math.PI / 1.8} // Don't go below floor
        enableRotate={false} // Disable mouse rotation to prioritize hand gestures
        enableZoom={true} // Allow scroll zoom
      />

      {/* Lighting - ARIX Pink/Purple Theme */}
      <ambientLight intensity={0.2} color={COLORS.ambient} />
      
      {/* Main Spot - Soft Pink */}
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={2.8} 
        color={COLORS.primary} 
        castShadow 
      />
      
      {/* Fill Light - Orchid */}
      <pointLight position={[-10, 5, -10]} intensity={1.5} color={COLORS.secondary} />
      
      {/* Rim Light - Cool Lavender */}
      <spotLight position={[0, 10, -15]} intensity={2.2} color={COLORS.highlight} />

      {/* Content Wrapped for Rotation */}
      <InnerScene rotationSpeed={rotationSpeed} isTreeShape={isTreeShape} isPinching={isPinching} />

      {/* Post Processing */}
      <EffectComposer multisampling={4}>
        <Bloom 
          luminanceThreshold={0.8} // Only very bright things bloom
          intensity={1.2} 
          radius={0.6} 
          mipmapBlur 
        />
        <Noise opacity={0.04} />
        <Vignette offset={0.1} darkness={0.7} />
      </EffectComposer>
      
      <Environment preset="city" background={false} blur={0.8} />
      <BakeShadows />
    </Canvas>
  );
};

export default Scene;