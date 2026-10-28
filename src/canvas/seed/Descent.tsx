import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils, Vector2 } from "three";
import { useJourney } from "../../app/store";
// Clip-space coverage has no billboard edges when the camera crosses the clouds.
const vertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const fragment = `uniform float uTime,uOpacity,uTravel;uniform vec2 uResolution;varying vec2 vUv;
float hash(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float n=0.,a=.57;for(int i=0;i<4;i++){n+=a*noise(p);p=mat2(.82,.57,-.57,.82)*p*2.04+7.3;a*=.48;}return n;}
void main(){vec2 ray=(vUv-.5)*vec2(uResolution.x/uResolution.y,1.);float optical=0.,wisps=0.;
for(int i=0;i<4;i++){float z=float(i);vec2 p=ray*(2.1+z*.85)+vec2(z*13.7+uTravel*.32,uTime*.035-z*4.1);
p+=vec2(fbm(p*.6+uTime*.018),fbm(p*.55+11.-uTime*.012))*.9;
float density=smoothstep(.15,.8,fbm(p+vec2(uTime*.035,0.)));optical+=density*(.55+z*.12);wisps+=density*.25;}
float alpha=(1.-exp(-optical*2.7))*uOpacity;
float billow=fbm(ray*2.3+vec2(uTravel*.26,uTime*.055));
vec3 light=mix(vec3(.2,.31,.4),vec3(.83,.88,.86),smoothstep(.32,.68,billow));light+=vec3(.04,.03,.012)*wisps;
gl_FragColor=vec4(light,alpha);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
/** Continuous optical density: no bounded cloud shapes or cross-device filters. */
export default function Descent() {
  const group = useRef<Group>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uTravel: { value: 0 },
      uResolution: { value: new Vector2(1, 1) },
    }),
    [],
  );
  useFrame(({ clock, size }) => {
    const { scrollProgress: p, reducedMotion } = useJourney.getState();
    const density =
      MathUtils.smoothstep(p, 0.035, 0.085) *
      (1 - MathUtils.smoothstep(p, 0.125, 0.17));
    uniforms.uTime.value = reducedMotion ? 0 : clock.elapsedTime;
    uniforms.uOpacity.value = density * 0.98;
    uniforms.uTravel.value = (p - 0.035) * 85;
    uniforms.uResolution.value.set(size.width, size.height);
    if (!group.current) return;
    group.current.visible = density > 0.001;
  });
  return (
    <group ref={group} name="descent-clouds">
      <mesh frustumCulled={false} renderOrder={100}>
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertex}
          fragmentShader={fragment}
          transparent
          depthWrite={false}
          depthTest={false}
          precision="highp"
        />
      </mesh>
    </group>
  );
}
