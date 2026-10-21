import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { Mesh, MeshBasicMaterial } from "three";
import { useJourney } from "../app/store";
export default function Environment() {
 const texture=useTexture("/environments/meadow.webp");
 const mesh=useRef<Mesh>(null);
 const mat=useRef<MeshBasicMaterial>(null);
 useFrame(({camera,viewport})=>{
   const p=useJourney.getState().scrollProgress;
   const opacity=Math.min(1,Math.max(0,(p-.085)/.045))*Math.min(1,Math.max(0,(.9-p)/.07));
   if(mesh.current&&mat.current) {
     mesh.current.visible=opacity>0;
     mesh.current.position.copy(camera.position);
     mesh.current.quaternion.copy(camera.quaternion);
     mesh.current.translateZ(-110);
     const h=2*110*Math.tan(Math.PI/8);
     mesh.current.scale.set(Math.max(h*viewport.aspect,h*1.777),Math.max(h,h*viewport.aspect/1.777),1);
     mat.current.opacity=opacity;
   }
 });
 return <mesh ref={mesh} renderOrder={-100}><planeGeometry/><meshBasicMaterial ref={mat} map={texture} transparent depthWrite={false} depthTest={true} toneMapped={false}/></mesh>;
}
