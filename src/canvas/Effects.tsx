import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing';
import { useJourney } from '../app/store';
export default function Effects(){const tier=useJourney(s=>s.qualityTier);return tier==='low'?null:<EffectComposer multisampling={0}><Bloom intensity={.32} luminanceThreshold={.85} luminanceSmoothing={.5} mipmapBlur/><Noise opacity={.018}/><Vignette eskil={false} offset={.25} darkness={.45}/></EffectComposer>}
