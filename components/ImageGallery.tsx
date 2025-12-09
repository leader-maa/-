/// <reference types="@react-three/fiber" />
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { easing } from 'maath';
import { MYSTERY_TEXTURES, getTreePos, getScatterPos, getRandomGift, GiftItem } from '../constants';

interface ImageItemProps {
    defaultTexture: THREE.Texture;
    scatterPos: THREE.Vector3;
    treePos: THREE.Vector3;
    isTreeShape: boolean;
    isPinching: boolean;
    index: number;
    activeRef: React.MutableRefObject<number>;
    revealedGift: GiftItem | null; // The specific gift won, contains the correct texture
}

const ImageItem: React.FC<ImageItemProps> = ({ 
    defaultTexture, 
    scatterPos, 
    treePos, 
    isTreeShape, 
    isPinching, 
    index, 
    activeRef, 
    revealedGift 
}) => {
    const ref = useRef<THREE.Group>(null);
    const textRef = useRef<any>(null); 
    const { camera } = useThree();
    const mixRef = useRef({ val: 0 }); 
    const zoomRef = useRef({ val: 0 }); 

    // Determine current look
    // If this specific card is Active AND we have a revealed gift, show the gift's texture
    const isActive = isPinching && activeRef.current === index;
    const currentTexture = (isActive && revealedGift) ? revealedGift.texture : defaultTexture;
    
    // Determine text
    const mainText = isActive && revealedGift ? revealedGift.name : "";
    const subText = isActive ? "恭喜！你发现了：" : "";

    useFrame((state, delta) => {
        if (!ref.current) return;

        // 1. Calculate Base Position
        const targetMix = isTreeShape ? 1 : 0;
        easing.damp(mixRef.current, 'val', targetMix, 1.0, delta);
        const m = mixRef.current.val;
        
        const currentBasePos = new THREE.Vector3().lerpVectors(scatterPos, treePos, m);
        
        // Floating motion
        if (zoomRef.current.val < 0.1) {
            currentBasePos.y += Math.sin(state.clock.elapsedTime + index * 100) * 0.1;
            ref.current.lookAt(new THREE.Vector3(0, currentBasePos.y, 0));
        }

        // 2. Zoom Logic
        const zoomTarget = isActive ? 1 : 0;
        easing.damp(zoomRef.current, 'val', zoomTarget, 0.3, delta); 
        const z = zoomRef.current.val;

        // Text Opacity
        if (textRef.current) {
            textRef.current.fillOpacity = THREE.MathUtils.smoothstep(z, 0.85, 1.0);
        }

        // 3. Final Position
        if (z > 0.001) {
            const camDir = new THREE.Vector3();
            camera.getWorldDirection(camDir);
            const camPos = camera.position.clone();
            
            // Move close to camera
            const targetWorldPos = camPos.add(camDir.multiplyScalar(2.5)); 
            
            if (ref.current.parent) {
                const targetLocalPos = ref.current.parent.worldToLocal(targetWorldPos.clone());
                ref.current.position.lerpVectors(currentBasePos, targetLocalPos, z);
            }
            
            const baseScale = 1.5;
            const targetScale = 1.3; 
            const s = THREE.MathUtils.lerp(baseScale, targetScale, z);
            ref.current.scale.setScalar(s);
            ref.current.lookAt(camera.position);

        } else {
            ref.current.position.copy(currentBasePos);
            ref.current.scale.setScalar(1.5);
        }
    });

    return (
        <group ref={ref}>
            <mesh>
                <planeGeometry args={[1, 1.2]} /> 
                <meshStandardMaterial 
                    map={currentTexture} 
                    transparent 
                    roughness={0.8} 
                    metalness={0.1}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <mesh position={[0,0,-0.01]} rotation={[0, Math.PI, 0]}>
                 <planeGeometry args={[1, 1.2]} />
                 <meshStandardMaterial color="#f0f0f0" roughness={1} />
            </mesh>
            
            {/* Text Overlay */}
            <group position={[0, -0.42, 0.02]} ref={textRef}>
                <Text
                    fontSize={0.05}
                    color="#555"
                    anchorX="center"
                    anchorY="top"
                    textAlign="center"
                    maxWidth={0.9}
                    renderOrder={10} 
                >
                    {subText}
                </Text>
                
                <Text
                    position={[0, -0.08, 0]}
                    fontSize={0.08}
                    color="#1a0b2e"
                    anchorX="center"
                    anchorY="top"
                    textAlign="center"
                    maxWidth={0.9}
                    lineHeight={1.2}
                    renderOrder={10}
                >
                    {mainText}
                </Text>
            </group>
        </group>
    );
};

const ImageGallery: React.FC<{ isTreeShape: boolean, isPinching: boolean }> = ({ isTreeShape, isPinching }) => {
    const activeRef = useRef<number>(-1);
    const [revealedGift, setRevealedGift] = useState<GiftItem | null>(null);
    
    // Sound
    const sfxRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Initialize SFX immediately
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-fairy-arcade-sparkle-866.mp3');
        audio.volume = 0.6;
        audio.preload = "auto";
        sfxRef.current = audio;
    }, []);

    // Create 8 floating cards. Initially they are just "Mystery Cards".
    const items = useMemo(() => {
        return Array.from({ length: 8 }).map((_, i) => {
            const tPos = getTreePos();
            // Push out a bit from center
            const r = Math.sqrt(tPos.x*tPos.x + tPos.z*tPos.z);
            if(r > 0.1) {
                tPos.x *= 1.3;
                tPos.z *= 1.3;
            }
            return {
                id: i,
                // Assign a random mystery texture so they don't look identical
                mysteryTex: MYSTERY_TEXTURES[i % MYSTERY_TEXTURES.length],
                scatterPos: getScatterPos(),
                treePos: tPos
            }
        })
    }, []);

    // Handle Interaction (Pinch)
    useEffect(() => {
        if (isPinching) {
            // Only trigger if we haven't selected one yet
            if (activeRef.current === -1 && items.length > 0) {
                
                // 1. Pick a random card ID to focus on
                const randomIdx = Math.floor(Math.random() * items.length);
                activeRef.current = items[randomIdx].id;

                // 2. Draw the gift IMMEDIATELY
                const gift = getRandomGift();
                setRevealedGift(gift);

                // 3. Play SFX
                if(sfxRef.current) {
                    // Reset time to allow rapid re-triggers if needed (though logic prevents rapid pinching)
                    sfxRef.current.currentTime = 0;
                    const playPromise = sfxRef.current.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(e => {
                            console.warn("SFX failed. Interaction needed?", e);
                        });
                    }
                }
            }
        } else {
            // Reset when released
            activeRef.current = -1;
            // We keep revealedGift for a split second logic or just let it clear.
            // Clearing it immediately ensures next time is fresh.
            // Since the card zooms out fast, clearing it might flash. 
            // Ideally we clear it only on next pinch, but simple is better:
            // Let's keep it until next pinch overwrites it? 
            // No, resetting helps the "Mystery" feel return.
             const timer = setTimeout(() => {
                setRevealedGift(null);
             }, 300); // Small delay to allow zoom out before swapping texture back
             return () => clearTimeout(timer);
        }
    }, [isPinching, items]);

    return (
        <group>
            {items.map((item) => (
                <ImageItem 
                    key={item.id}
                    index={item.id}
                    defaultTexture={item.mysteryTex}
                    scatterPos={item.scatterPos}
                    treePos={item.treePos}
                    isTreeShape={isTreeShape}
                    isPinching={isPinching}
                    activeRef={activeRef}
                    revealedGift={revealedGift}
                />
            ))}
        </group>
    )
}

export default ImageGallery;