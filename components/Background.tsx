import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { easing } from 'maath';

export const BackgroundParticles = () => {
    const count = 1000;
    const meshRef = useRef<THREE.Points>(null);

    const positions = React.useMemo(() => {
        const arr = new Float32Array(count * 3);
        for(let i=0; i<count; i++) {
            const r = 40 + Math.random() * 40; // Far out
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            arr[i*3] = r * Math.sin(phi) * Math.cos(theta);
            arr[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
            arr[i*3+2] = r * Math.cos(phi);
        }
        return arr;
    }, []);

    useFrame((state, delta) => {
        if(meshRef.current) {
            meshRef.current.rotation.y += delta * 0.02;
        }
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial size={0.2} color="#da70d6" transparent opacity={0.4} sizeAttenuation />
        </points>
    );
};

export const Floor = ({ isTreeShape }: { isTreeShape: boolean }) => {
    const matRef = useRef<THREE.MeshStandardMaterial>(null);

    useFrame((_, delta) => {
        if(matRef.current) {
            const targetOpacity = isTreeShape ? 0.3 : 0.0;
            easing.damp(matRef.current, 'opacity', targetOpacity, 1.5, delta);
        }
    })

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
            <circleGeometry args={[14, 64]} />
            <meshStandardMaterial 
                ref={matRef} 
                color="#e8d4e8" 
                roughness={0.8} 
                metalness={0.1}
                transparent
                opacity={0}
            />
        </mesh>
    )
}