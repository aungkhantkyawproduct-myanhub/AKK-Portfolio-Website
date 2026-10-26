/** Fixed celestial dome. All movement is time-driven, independent of scroll. */
export const skyFragment = `varying vec3 vDirection;uniform float uTime;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
float fbm(vec2 p){float f=0.,a=.5;for(int i=0;i<5;i++){f+=noise(p)*a;p=p*2.03+4.7;a*=.5;}return f;}
void main(){vec3 d=normalize(vDirection);float h=max(d.y,0.);vec2 uv=vec2(atan(d.z,d.x),asin(d.y));
vec3 color=mix(vec3(.012,.035,.065),vec3(.004,.013,.045),smoothstep(0.,.8,h));
float nebula=fbm(uv*vec2(7.,9.));float milky=exp(-pow((uv.y-.65-.21*sin(uv.x*.9))/.24,2.));
color+=mix(vec3(.025,.05,.11),vec3(.095,.06,.17),nebula)*milky*pow(nebula,1.5)*1.3;
// Overlapping soft curtains; vertical rays bend along broad travelling folds.
for(int i=0;i<3;i++) {float fi=float(i);float x=uv.x+fi*1.8;
float wave=.47+fi*.16+.15*sin(x*2.+uTime*.075)+.055*sin(x*5.-uTime*.12);
float ribbon=exp(-pow((uv.y-wave)/(.13+fi*.015),2.));
float fold=.4+.6*noise(vec2(x*22.+sin(uv.y*7.+uTime*.11)*2.+uTime*.18,uv.y*1.2));
float ray=pow(fold,2.)*(.7+.3*noise(vec2(x*95.+uTime*.23,uv.y*3.)));
vec3 aurora=mix(vec3(.015,.49,.29),vec3(.14,.16,.48),smoothstep(wave-.02,wave+.2,uv.y));
color+=aurora*ribbon*ray*(.48-fi*.1);}
vec2 c=uv*vec2(4.2,10.);c.x+=uTime*.006;float cloud=fbm(c+fbm(c*.7));
float clouds=smoothstep(.43,.76,cloud)*(1.-smoothstep(.02,.31,h));
color=mix(color,vec3(.035,.072,.11)+vec3(.025,.035,.04)*cloud,clouds*.75);
float haze=exp(-pow((uv.y-.012)/.045,2.));color+=vec3(.016,.038,.044)*haze;
vec2 cell=uv*1300.,point=fract(cell)-.5;float stars=step(.9915,hash(floor(cell)))*exp(-dot(point,point)*35.)*smoothstep(.015,.2,h);
float twinkle=.82+.18*sin(uTime*.65+hash(floor(cell))*40.);color+=vec3(.62,.8,1.)*stars*twinkle;
gl_FragColor=vec4(color,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
