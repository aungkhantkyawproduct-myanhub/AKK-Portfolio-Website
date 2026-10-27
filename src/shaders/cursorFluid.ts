export const fluidVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/** Stable-fluid passes: advection, splats, curl, confinement and projection.
 * Velocity uses simulation cells/second; all fields use normalized UVs.
 */
export const fluidFragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uSource;
uniform sampler2D uVelocity;
uniform sampler2D uAux;
uniform vec2 uTexel;
uniform vec2 uPoint;
uniform vec3 uSplat;
uniform float uAspect;
uniform float uRadius;
uniform float uImpulse;
uniform float uDt;
uniform float uDecay;
uniform float uTime;
uniform int uMode;
void main() {
  vec2 uv = vUv;
  vec2 dx = vec2(uTexel.x, 0.0), dy = vec2(0.0, uTexel.y);
  vec4 result = vec4(0.0, 0.0, 0.0, 1.0);
  if (uMode == 0) {
    vec2 velocity = texture2D(uVelocity, uv).xy;
    vec2 back = clamp(uv - uDt * velocity * uTexel, vec2(0.001), vec2(0.999));
    result.xyz = texture2D(uSource, back).xyz * uDecay;
  } else if (uMode == 1 || uMode == 2) {
    vec2 p = uv - uPoint;
    p.x *= uAspect;
    float stamp = exp(-dot(p, p) / uRadius);
    result.xyz = texture2D(uSource, uv).xyz + stamp * uSplat;
    if (uMode == 1) {
      vec2 curl = vec2(-p.y, p.x) * sin(uTime * 1.7) * 90.0 * uImpulse;
      result.xy += stamp * curl;
      result.xy = clamp(result.xy, vec2(-240.0), vec2(240.0));
    } else result.xyz = min(result.xyz, vec3(3.0));
  } else if (uMode == 3) {
    float l = texture2D(uVelocity, uv - dx).y;
    float r = texture2D(uVelocity, uv + dx).y;
    float b = texture2D(uVelocity, uv - dy).x;
    float t = texture2D(uVelocity, uv + dy).x;
    result.x = 0.5 * (r - l - t + b);
  } else if (uMode == 4) {
    float l = abs(texture2D(uAux, uv - dx).x);
    float r = abs(texture2D(uAux, uv + dx).x);
    float b = abs(texture2D(uAux, uv - dy).x);
    float t = abs(texture2D(uAux, uv + dy).x);
    float c = texture2D(uAux, uv).x;
    vec2 n = vec2(r - l, t - b);
    n /= length(n) + 0.0001;
    vec2 force = vec2(n.y, -n.x) * c * 22.0;
    result.xy = clamp(texture2D(uVelocity, uv).xy + force * uDt, vec2(-240.0), vec2(240.0));
  } else if (uMode == 5) {
    vec2 c = texture2D(uVelocity, uv).xy;
    float l = uv.x < uTexel.x ? -c.x : texture2D(uVelocity, uv - dx).x;
    float r = uv.x > 1.0 - uTexel.x ? -c.x : texture2D(uVelocity, uv + dx).x;
    float b = uv.y < uTexel.y ? -c.y : texture2D(uVelocity, uv - dy).y;
    float t = uv.y > 1.0 - uTexel.y ? -c.y : texture2D(uVelocity, uv + dy).y;
    result.x = 0.5 * (r - l + t - b);
  } else if (uMode == 6) {
    float l = texture2D(uSource, uv - dx).x;
    float r = texture2D(uSource, uv + dx).x;
    float b = texture2D(uSource, uv - dy).x;
    float t = texture2D(uSource, uv + dy).x;
    result.x = (l + r + b + t - texture2D(uAux, uv).x) * 0.25;
  } else if (uMode == 7) {
    float l = texture2D(uSource, uv - dx).x;
    float r = texture2D(uSource, uv + dx).x;
    float b = texture2D(uSource, uv - dy).x;
    float t = texture2D(uSource, uv + dy).x;
    result.xy = texture2D(uVelocity, uv).xy - 0.5 * vec2(r - l, t - b);
  } else result.x = texture2D(uSource, uv).x * uDecay;
  gl_FragColor = result;
}
`;
