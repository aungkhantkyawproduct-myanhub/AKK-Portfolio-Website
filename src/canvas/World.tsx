import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import Earth from './earth/Earth';
import CameraRig from './CameraRig';
import Seed from './seed/Seed';
import Tree from './tree/Tree';
import Realms from './tree/Realms';
import PolarEffects from './earth/PolarEffects';
import Descent, { Grass } from './seed/Descent';
import Effects from './Effects';
export default function World(){return <Canvas camera={{position:[0,3,12.7],fov:45}} dpr={[1,1.5]} gl={{antialias:true,logarithmicDepthBuffer:false}}><color attach="background" args={['#05070d']}/><ambientLight intensity={.7}/><directionalLight position={[-10,10,10]} intensity={2}/><Stars radius={100} depth={40} count={1600} factor={2} fade/><Earth/><PolarEffects/><CameraRig/><Seed/><Grass/><Descent/><Tree/><Realms/><Effects/></Canvas>}



