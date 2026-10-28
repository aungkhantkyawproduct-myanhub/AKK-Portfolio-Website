import {
  BufferAttribute,
  BufferGeometry,
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  Mesh,
  NoBlending,
  OrthographicCamera,
  RepeatWrapping,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";

const vertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const fragment = `
uniform sampler2D uNoise,uSource;
uniform vec2 uDirection;
uniform float uMode,uTime,uTravel,uAspect;
varying vec2 vUv;
void main(){
  if(uMode<.5){
    vec2 p=(vUv-.5)*vec2(uAspect,1.);
    float a=texture2D(uNoise,p*.48+vec2(uTime*.014,uTravel*.15)).r;
    float b=texture2D(uNoise,p*.91+vec2(.37-uTime*.009,.61+uTime*.006)).r;
    float c=texture2D(uNoise,p*1.7+vec2(.71+uTime*.006,.24-uTime*.009)).r;
    // Continuous interpolation only: no density/color cutoffs or contour bands.
    float n=a*.55+b*.3+c*.15;
    float alpha=1.-exp(-(.9+n*1.8)*2.4);
    vec3 light=mix(vec3(.32,.44,.52),vec3(.86,.9,.9),n);
    gl_FragColor=vec4(light*alpha,alpha);
  }else{
    // A real separable Gaussian, applied to premultiplied color AND density.
    vec4 sum=texture2D(uSource,vUv)*.227027027;
    sum+=(texture2D(uSource,vUv+uDirection)+texture2D(uSource,vUv-uDirection))*.194594595;
    sum+=(texture2D(uSource,vUv+uDirection*2.)+texture2D(uSource,vUv-uDirection*2.))*.121621622;
    sum+=(texture2D(uSource,vUv+uDirection*3.)+texture2D(uSource,vUv-uDirection*3.))*.054054054;
    sum+=(texture2D(uSource,vUv+uDirection*4.)+texture2D(uSource,vUv-uDirection*4.))*.016216216;
    gl_FragColor=sum;
  }
}`;

/** Periodic, quintic-interpolated CPU noise avoids device-dependent shader hashes. */
function makeNoise() {
  const size = 128,
    pixels = new Uint8Array(size * size * 4);
  const hash = (x: number, y: number, period: number) => {
    let n =
      (Math.imul((x + period) % period, 374761393) +
        Math.imul((y + period) % period, 668265263) +
        4919) |
      0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      let n = 0;
      for (let octave = 0; octave < 4; octave++) {
        const period = 2 ** (octave + 1),
          px = (x / size) * period,
          py = (y / size) * period;
        const ix = Math.floor(px),
          iy = Math.floor(py),
          fx = ease(px - ix),
          fy = ease(py - iy);
        const low =
          hash(ix, iy, period) * (1 - fx) + hash(ix + 1, iy, period) * fx;
        const high =
          hash(ix, iy + 1, period) * (1 - fx) +
          hash(ix + 1, iy + 1, period) * fx;
        n += (low * (1 - fy) + high * fy) * [0.55, 0.27, 0.13, 0.05][octave];
      }
      const i = (y * size + x) * 4,
        value = Math.round(n * 255);
      pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
      pixels[i + 3] = 255;
    }
  const texture = new DataTexture(
    pixels,
    size,
    size,
    RGBAFormat,
    UnsignedByteType,
  );
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

/** Three small GPU draws in the existing RAF; no new canvas or global blur. */
export class MistField {
  readonly noise = makeNoise();
  readonly scene = new Scene();
  readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  readonly geometry = new BufferGeometry();
  readonly uniforms = {
    uNoise: { value: this.noise },
    uSource: { value: this.noise as WebGLRenderTarget["texture"] },
    uDirection: { value: new Vector2() },
    uMode: { value: 0 },
    uTime: { value: 0 },
    uTravel: { value: 0 },
    uAspect: { value: 1 },
  };
  readonly material = new ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: this.uniforms,
    depthTest: false,
    depthWrite: false,
    blending: NoBlending,
    toneMapped: false,
  });
  private a?: WebGLRenderTarget;
  private b?: WebGLRenderTarget;
  private width = 0;
  private height = 0;
  softness = 0;
  passes = 0;

  constructor() {
    this.geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
    );
    this.geometry.setAttribute(
      "uv",
      new BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2),
    );
    const mesh = new Mesh(this.geometry, this.material);
    mesh.frustumCulled = false;
    this.scene.add(mesh);
  }
  get texture() {
    return this.a?.texture ?? this.noise;
  }
  get dimensions() {
    return [this.width, this.height];
  }
  update(
    gl: WebGLRenderer,
    width: number,
    height: number,
    time: number,
    travel: number,
  ) {
    const scale = Math.min(
      1,
      (width < 600 ? 256 : 384) / Math.max(width, height),
    );
    const w = Math.max(32, Math.round(width * scale)),
      h = Math.max(32, Math.round(height * scale));
    if (!this.a || !this.b || w !== this.width || h !== this.height) {
      this.a?.dispose();
      this.b?.dispose();
      const options = {
        type: UnsignedByteType,
        format: RGBAFormat,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        wrapS: ClampToEdgeWrapping,
        wrapT: ClampToEdgeWrapping,
        depthBuffer: false,
        stencilBuffer: false,
      };
      this.a = new WebGLRenderTarget(w, h, options);
      this.b = new WebGLRenderTarget(w, h, options);
      this.width = w;
      this.height = h;
    }
    this.softness = Math.max(18, Math.min(40, Math.min(width, height) * 0.04));
    const target = gl.getRenderTarget(),
      auto = gl.autoClear,
      xr = gl.xr.enabled;
    gl.xr.enabled = false;
    gl.autoClear = true;
    try {
      this.uniforms.uTime.value = time;
      this.uniforms.uTravel.value = travel;
      this.uniforms.uAspect.value = width / height;
      this.uniforms.uMode.value = 0;
      // Never sample the render target currently being written.
      this.uniforms.uSource.value = this.noise;
      gl.setRenderTarget(this.a);
      gl.render(this.scene, this.camera);
      this.uniforms.uMode.value = 1;
      this.uniforms.uSource.value = this.a.texture;
      this.uniforms.uDirection.value.set(this.softness / (1.7 * width), 0);
      gl.setRenderTarget(this.b);
      gl.render(this.scene, this.camera);
      this.uniforms.uSource.value = this.b.texture;
      this.uniforms.uDirection.value.set(0, this.softness / (1.7 * height));
      gl.setRenderTarget(this.a);
      gl.render(this.scene, this.camera);
      this.passes = 3;
    } finally {
      gl.setRenderTarget(target);
      gl.autoClear = auto;
      gl.xr.enabled = xr;
    }
  }
  inspect(gl: WebGLRenderer) {
    if (!this.a) return null;
    const pixels = new Uint8Array(this.width * this.height * 4);
    gl.readRenderTargetPixels(this.a, 0, 0, this.width, this.height, pixels);
    let maxNeighbor = 0,
      sumNeighbor = 0,
      count = 0,
      min = 255,
      max = 0,
      signature = 0;
    const bins = new Set<number>();
    for (let y = 1; y < this.height; y++)
      for (let x = 1; x < this.width; x++) {
        const i = (y * this.width + x) * 4,
          v = pixels[i];
        bins.add(v);
        min = Math.min(min, v);
        max = Math.max(max, v);
        signature += v * (1 + (i % 97));
        const dx = Math.abs(v - pixels[i - 4]),
          dy = Math.abs(v - pixels[i - this.width * 4]);
        maxNeighbor = Math.max(maxNeighbor, dx, dy);
        sumNeighbor += dx + dy;
        count += 2;
      }
    return {
      dimensions: this.dimensions,
      softness: this.softness,
      passes: this.passes,
      maxNeighbor,
      meanNeighbor: sumNeighbor / count,
      levels: bins.size,
      range: [min, max],
      signature,
    };
  }
  dispose() {
    this.a?.dispose();
    this.b?.dispose();
    this.noise.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }
}
