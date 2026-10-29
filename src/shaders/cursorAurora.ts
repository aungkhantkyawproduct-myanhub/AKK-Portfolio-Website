/** Final, scene-only refraction and translucent ink. DOM copy stays crisp. */
export const cursorAuroraFragment = /* glsl */ `
uniform sampler2D uDye;
uniform sampler2D uFlow;
uniform vec2 uDyeTexel;
uniform vec2 uSimTexel;
uniform float uEnergy;
uniform float uProfile;
uniform sampler2D uMist;
uniform float uMistOpacity;
float density(vec2 uv) {
  vec3 c = texture2D(uDye, uv).rgb;
  return max(c.r, max(c.g, c.b));
}
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec3 light = vec3(0.0);
  vec3 scene = inputColor.rgb;
  if (uEnergy > 0.001) {
    vec3 dye = texture2D(uDye, uv).rgb;
    float d = max(dye.r, max(dye.g, dye.b));
    if (d > 0.0005) {
      vec2 grad = vec2(
        density(uv + vec2(uDyeTexel.x, 0.0)) - density(uv - vec2(uDyeTexel.x, 0.0)),
        density(uv + vec2(0.0, uDyeTexel.y)) - density(uv - vec2(0.0, uDyeTexel.y))
      );
      vec2 flow = texture2D(uFlow, uv).xy * uSimTexel;
      vec2 offset = clamp(grad * 0.018 + flow * 0.003 * min(d, 1.0), vec2(-0.008), vec2(0.008));
      scene = texture2D(inputBuffer, clamp(uv + offset, vec2(0.001), vec2(0.999))).rgb;
      float ridge = min(length(grad) * 3.0, 0.32);
      light = (1.0 - exp(-dye * 1.3)) * (0.3 + ridge);
      light *= uEnergy * mix(1.0, 0.62, uProfile);
    }
  }
  float worldAlpha = 1.0 - uProfile;
  float lightAlpha = max(light.r, max(light.g, light.b));
  float alpha = worldAlpha + (1.0 - worldAlpha) * lightAlpha;
  vec3 base = scene * worldAlpha;
  vec3 combined = base + light * (1.0 - clamp(base, 0.0, 1.0));
  // Composite after scene tone mapping: transparent mist must not be processed
  // as opaque HDR geometry or pass through a second tone curve on low tier.
  vec4 mist = texture2D(uMist, uv);
  float fog = uMistOpacity * worldAlpha;
  combined = combined * (1.0 - mist.a * fog) + mist.rgb * fog;
  outputColor = vec4(combined / max(alpha, 0.0001), alpha);
}
`;
