import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import Earth from './earth/Earth';
export default function World(){return <Canvas camera={{position:[0,6,24],fov:45}} dpr={[1,1.5]} gl={{antialias:true,logarithmicDepthBuffer:true}}><color attach="background" args={['#05070d']}/><ambientLight intensity={.5}/><directionalLight position={[-10,10,10]} intensity={3}/><Stars radius={80} depth={40} count={1600} factor={2} fade/><Earth/></Canvas>}
