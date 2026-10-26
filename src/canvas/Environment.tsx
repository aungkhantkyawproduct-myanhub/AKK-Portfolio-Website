import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { BackSide, Group, FogExp2 } from "three";
import { useJourney } from "../app/store";
/** The sky is fixed in world space. Only wind and light evolve with time. */
export default function Environment() {
  const group = useRef<Group>(null);
  const { scene } = useThree();
  const fog = useMemo(() => new FogExp2("#112531", 0.0045), []);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock }) => {
    const local = useJourney.getState().scrollProgress > 0.105;
    scene.fog = local ? fog : null;
    if (group.current) group.current.visible = local;
    uniforms.uTime.value = useJourney.getState().reducedMotion
      ? 0
      : clock.elapsedTime;
  });
  return (
    <group ref={group} name="sky">
      <mesh>
        <sphereGeometry args={[130, 64, 40]} />
        <shaderMaterial
          side={BackSide}
          depthWrite={false}
          uniforms={uniforms}
          vertexShader={`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
          fragmentShader={`varying vec3 vDirection;uniform float uTime;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}float fbm(vec2 p){float f=0.,a=.5;for(int i=0;i<5;i++){f+=noise(p)*a;p=p*2.03+4.7;a*=.5;}return f;}
 void main(){vec3 d=normalize(vDirection);float h=max(d.y,0.);vec2 uv=vec2(atan(d.z,d.x),asin(d.y));vec3 color=mix(vec3(.006,.018,.037),vec3(.004,.014,.048),smoothstep(0.,.85,h));
 float nebula=fbm(uv*vec2(5.,8.));float milky=exp(-pow((uv.y-.52-.22*sin(uv.x*.8))/.18,2.));color+=vec3(.018,.027,.07)*milky*pow(nebula,2.);
 vec2 c=uv*vec2(4.2,9.);c.x+=uTime*.003;float cloud=fbm(c+fbm(c*.7));float wisps=smoothstep(.54,.78,cloud)*(1.-smoothstep(.02,.32,h));color=mix(color,vec3(.025,.05,.09),wisps*.46);
 float wave=.42+.17*sin(uv.x*2.2+uTime*.045)+.04*sin(uv.x*8.-uTime*.09);float curtain=exp(-pow((uv.y-wave)/.13,2.));float folds=noise(vec2(uv.x*48.+sin(uv.y*9.+uTime*.08)*1.2+uTime*.1,uv.y*1.3));float rays=pow(folds,3.);float window=pow(.5+.5*cos(uv.x*1.6+2.5),2.);vec3 aurora=mix(vec3(.025,.62,.43),vec3(.16,.12,.46),smoothstep(wave,wave+.18,uv.y));color+=aurora*curtain*rays*window*.85;
 vec2 cell=uv*1200.;vec2 starUv=fract(cell)-.5;float stars=step(.994,hash(floor(cell)))*exp(-dot(starUv,starUv)*35.)*smoothstep(.02,.25,h);float twinkle=.8+.2*sin(uTime*.45+hash(floor(cell))*40.);color+=vec3(.65,.82,1.)*stars*twinkle;gl_FragColor=vec4(color,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}
        />
      </mesh>
    </group>
  );
}
