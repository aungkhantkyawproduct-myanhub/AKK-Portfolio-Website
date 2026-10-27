/** Screen-space curtains; work is bounded to the local light patch. */
export const cursorAuroraFragment = `
uniform vec2 uHead;
uniform vec2 uWake;
uniform vec2 uViewport;
uniform vec2 uVelocity;
uniform float uTime;
uniform float uFlowAngle;
uniform float uEnergy;
uniform float uLayers;
uniform float uProfile;
uniform vec3 uEmerald;
uniform vec3 uCyan;
uniform vec3 uViolet;
float auroraHash(vec2 p) { return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float auroraNoise(vec2 p) {
  vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(auroraHash(i),auroraHash(i+vec2(1,0)),f.x),mix(auroraHash(i+vec2(0,1)),auroraHash(i+1.),f.x),f.y);
}
float auroraFbm(vec2 p) {
  float n=auroraNoise(p)*.57;
  p=p*2.03+vec2(7.1,3.7); n+=auroraNoise(p)*.28;
  p=p*2.07+vec2(2.3,8.1); n+=auroraNoise(p)*.15;
  return n;
}
void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor) {
  vec3 light=vec3(0.);
  vec2 center=mix(uWake,uHead,.72);
  float scale=clamp(min(uViewport.x,uViewport.y)*.15,90.,140.);
  vec2 p=(uv-center)*uViewport/scale;
  // Most pixels bypass all noise when idle or outside the local light patch.
  if(uEnergy>.001 && dot(p,p)<7.84) {
    float speed=clamp(length(uVelocity)/1200.,0.,1.);
    float t=uTime;
    for(int i=0;i<3;i++) {
      float layer=float(i); if(layer>=uLayers) break;
      // Each sheet has its own turning, cross-flow and elastic domain warp.
      float angle=uFlowAngle+.24*sin(t*.31+layer*2.1)+.13*cos(t*.19-layer);
      float ca=cos(angle),sa=sin(angle);
      vec2 q=vec2(ca*p.x+sa*p.y,-sa*p.x+ca*p.y);
      q.x/=1.+speed*.26;
      vec2 swirl=vec2(auroraNoise(q*1.35+vec2(t*.1,layer*3.1)),auroraNoise(q.yx*1.13+vec2(-t*.08,layer*5.7)))-.5;
      q+=swirl*.48;
      q.x+=.16*sin(q.y*2.3+t*.42+layer);
      q.y+=.12*sin(q.x*3.1-t*.35+layer*2.)-.12;
      float direction=mod(layer,2.)<.5?1.:-1.;
      float x=q.x+layer*.29;
      float drift=auroraFbm(vec2(x*1.3+layer*5.,t*.065));
      float fold=.17*sin(x*2.7+t*.32+layer*1.7)+.085*sin(x*5.9-t*.21+layer)+.16*(drift-.5);
      float hem=-.24+layer*.08+fold;
      float height=q.y-hem;
      float warp=.22*sin(height*2.6+t*.43+layer)+.16*(drift-.5);
      float rays=auroraFbm(vec2((x+warp)*18.+t*.13*direction,height*.65-t*.17*direction+layer*4.));
      float fine=auroraNoise(vec2((x+warp*.65)*68.-t*.26,layer*8.+t*.08));
      float pillars=pow(max(0.,rays),2.1)*(.38+.62*pow(fine,1.5));
      float curtain=smoothstep(-.035,.075,height)*exp(-max(height,0.)*2.25);
      float rim=exp(-pow(height/.08,2.))*.3;
      float edge=exp(-pow(abs(q.x+layer*.13)/1.36,4.));
      float top=1.-smoothstep(.8,1.65,height);
      vec3 tint=mix(uEmerald,uCyan,smoothstep(.12,.62,height));
      tint=mix(tint,uViolet,smoothstep(.55,1.3,height));
      light+=tint*(pillars*curtain*2.4+rim*(.2+.8*rays))*edge*top*(.85-layer*.17);
    }
    light=(1.-exp(-light*1.35))*uEnergy*.62*mix(1.,.4,uProfile)*(1.-smoothstep(2.1,2.8,length(p)));
  }
  // Fade the journey over the DOM biography while retaining local cursor light.
  // Straight alpha matches the canvas's premultipliedAlpha:false setting.
  float worldAlpha=1.-uProfile;
  float lightAlpha=max(light.r,max(light.g,light.b));
  float alpha=worldAlpha+(1.-worldAlpha)*lightAlpha;
  vec3 base=inputColor.rgb*worldAlpha;
  vec3 combined=base+light*(1.-clamp(base,0.,1.));
  outputColor=vec4(combined/max(alpha,.0001),alpha);
}`;
