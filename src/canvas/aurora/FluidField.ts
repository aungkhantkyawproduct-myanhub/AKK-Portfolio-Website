import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  DataUtils,
  HalfFloatType,
  LinearFilter,
  Mesh,
  NearestFilter,
  NoBlending,
  OrthographicCamera,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { fluidFragment, fluidVertex } from "../../shaders/cursorFluid";
import { cursorFluidPalette } from "../../styles/palette";
import type { AuroraMotion } from "./motion";

class FieldPair {
  read: WebGLRenderTarget;
  write: WebGLRenderTarget;
  constructor(width: number, height: number, linear = false) {
    const options = {
      type: HalfFloatType,
      format: RGBAFormat,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: linear ? LinearFilter : NearestFilter,
      magFilter: linear ? LinearFilter : NearestFilter,
    };
    this.read = new WebGLRenderTarget(width, height, options);
    this.write = new WebGLRenderTarget(width, height, options);
  }
  swap() {
    const t = this.read;
    this.read = this.write;
    this.write = t;
  }
}

/** Persistent GPU ink, advanced by the world's existing RAF loop.
 * Allocate only on input, outside the critical loader path; skip idle passes.
 */
export class FluidField {
  readonly empty = new DataTexture(new Uint8Array(4), 1, 1, RGBAFormat);
  readonly simTexel = new Vector2(1, 1);
  readonly dyeTexel = new Vector2(1, 1);
  active = false;
  supported = true;
  passes = 0;
  steps = 0;
  private width = 0;
  private height = 0;
  private lastX = 0;
  private lastY = 0;
  private velocity?: FieldPair;
  private dye?: FieldPair;
  private pressure?: FieldPair;
  private curl?: WebGLRenderTarget;
  private divergence?: WebGLRenderTarget;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly clearColor = new Color();
  private readonly geometry = new BufferGeometry();
  private readonly uniforms = {
    uMode: { value: 0 },
    uSource: { value: null as Texture | null },
    uVelocity: { value: null as Texture | null },
    uAux: { value: null as Texture | null },
    uTexel: { value: this.simTexel },
    uPoint: { value: new Vector2() },
    uSplat: { value: new Vector3() },
    uAspect: { value: 1 },
    uRadius: { value: 0.0015 },
    uImpulse: { value: 1 },
    uDt: { value: 0 },
    uDecay: { value: 1 },
    uTime: { value: 0 },
  };
  private readonly material = new ShaderMaterial({
    uniforms: this.uniforms,
    vertexShader: fluidVertex,
    fragmentShader: fluidFragment,
    depthTest: false,
    depthWrite: false,
    blending: NoBlending,
    toneMapped: false,
  });
  constructor() {
    this.empty.needsUpdate = true;
    this.geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
    );
    const triangle = new Mesh(this.geometry, this.material);
    triangle.frustumCulled = false;
    this.scene.add(triangle);
  }
  get dyeTexture() {
    return this.active && this.dye ? this.dye.read.texture : this.empty;
  }
  get flowTexture() {
    return this.active && this.velocity
      ? this.velocity.read.texture
      : this.empty;
  }
  get dimensions() {
    return this.velocity && this.dye
      ? {
          velocity: [this.velocity.read.width, this.velocity.read.height],
          dye: [this.dye.read.width, this.dye.read.height],
        }
      : null;
  }
  private targets() {
    return [
      this.velocity?.read,
      this.velocity?.write,
      this.dye?.read,
      this.dye?.write,
      this.pressure?.read,
      this.pressure?.write,
      this.curl,
      this.divergence,
    ];
  }
  private clear(gl: WebGLRenderer) {
    gl.setClearColor(0, 0);
    for (const target of this.targets())
      if (target) {
        gl.setRenderTarget(target);
        gl.clear(true, false, false);
      }
  }
  private allocate(width: number, height: number) {
    for (const t of this.targets()) t?.dispose();
    const aspect = width / height;
    const sw = Math.max(16, Math.round(160 * Math.min(1, aspect)));
    const sh = Math.max(16, Math.round(160 * Math.min(1, 1 / aspect)));
    const dw = Math.max(16, Math.round(768 * Math.min(1, aspect)));
    const dh = Math.max(16, Math.round(768 * Math.min(1, 1 / aspect)));
    this.velocity = new FieldPair(sw, sh, true);
    this.dye = new FieldPair(dw, dh, true);
    this.pressure = new FieldPair(sw, sh);
    this.curl = this.pressure.read.clone();
    this.divergence = this.pressure.read.clone();
    this.simTexel.set(1 / sw, 1 / sh);
    this.dyeTexel.set(1 / dw, 1 / dh);
    this.width = width;
    this.height = height;
    this.uniforms.uAspect.value = aspect;
    this.active = false;
  }
  private pass(
    gl: WebGLRenderer,
    mode: number,
    target: WebGLRenderTarget,
    source: Texture,
    aux: Texture = this.empty,
  ) {
    this.uniforms.uMode.value = mode;
    this.uniforms.uSource.value = source;
    this.uniforms.uAux.value = aux;
    // Even an inactive sampler must never reference the target being written.
    this.uniforms.uVelocity.value = this.velocity!.read.texture;
    this.material.uniformsNeedUpdate = true;
    gl.setRenderTarget(target);
    gl.render(this.scene, this.camera);
    this.passes++;
  }
  update(
    gl: WebGLRenderer,
    motion: AuroraMotion,
    delta: number,
    now: number,
    low: boolean,
  ) {
    this.passes = 0;
    if (!motion.enabled || !motion.initialized || document.hidden) {
      this.active = false;
      return;
    }
    if (!gl.extensions.has("EXT_color_buffer_float")) {
      this.supported = false;
      return;
    }
    if (this.width !== motion.width || this.height !== motion.height)
      this.allocate(motion.width, motion.height);
    const velocity = this.velocity!,
      dye = this.dye!,
      pressure = this.pressure!;
    const previousTarget = gl.getRenderTarget(),
      autoClear = gl.autoClear;
    const alpha = gl.getClearAlpha();
    gl.getClearColor(this.clearColor);
    gl.autoClear = false;
    try {
      if (!this.active) {
        this.clear(gl);
        this.lastX = motion.x;
        this.lastY = motion.y;
        this.active = true;
      }
      const dt = Math.min(1 / 30, Math.max(0, delta));
      const decayDt = Math.min(0.25, Math.max(0, delta));
      const u = this.uniforms;
      u.uDt.value = dt;
      u.uTime.value = motion.time;
      u.uVelocity.value = velocity.read.texture;
      u.uDecay.value = Math.exp(-dt * 0.7);
      this.pass(gl, 0, velocity.write, velocity.read.texture);
      velocity.swap();
      const speed = Math.hypot(motion.vx, motion.vy);
      if (now - motion.lastInput < 0.4 && speed > 8) {
        const count = Math.min(
          3,
          Math.max(
            1,
            Math.ceil(
              Math.hypot(motion.x - this.lastX, motion.y - this.lastY) / 24,
            ),
          ),
        );
        const blend = Math.min(
          1,
          Math.max(
            0,
            (Math.sin(motion.time * 1.4 + motion.flowAngle) + 0.4) / 0.8,
          ),
        );
        const warmth = blend * blend * (3 - 2 * blend);
        const warm = cursorFluidPalette.warm,
          cool = cursorFluidPalette.cool;
        for (let i = 1; i <= count; i++) {
          u.uPoint.value.set(
            (this.lastX + ((motion.x - this.lastX) * i) / count) / motion.width,
            1 -
              (this.lastY + ((motion.y - this.lastY) * i) / count) /
                motion.height,
          );
          u.uRadius.value = 0.0018;
          u.uImpulse.value = (dt * 60) / count;
          u.uSplat.value
            .set(
              motion.vx / motion.width / this.simTexel.x,
              -motion.vy / motion.height / this.simTexel.y,
              0,
            )
            .multiplyScalar((dt * 7) / count);
          this.pass(gl, 1, velocity.write, velocity.read.texture);
          velocity.swap();
          u.uRadius.value = 0.00095;
          const dose =
            (Math.min(1.2, speed / 700) * Math.min(delta, 0.05) * 11) / count;
          u.uSplat.value
            .set(
              cool[0] + (warm[0] - cool[0]) * warmth,
              cool[1] + (warm[1] - cool[1]) * warmth,
              cool[2] + (warm[2] - cool[2]) * warmth,
            )
            .multiplyScalar(dose);
          this.pass(gl, 2, dye.write, dye.read.texture);
          dye.swap();
        }
      }
      this.lastX = motion.x;
      this.lastY = motion.y;
      u.uVelocity.value = velocity.read.texture;
      this.pass(gl, 3, this.curl!, velocity.read.texture);
      this.pass(
        gl,
        4,
        velocity.write,
        velocity.read.texture,
        this.curl!.texture,
      );
      velocity.swap();
      u.uVelocity.value = velocity.read.texture;
      this.pass(gl, 5, this.divergence!, velocity.read.texture);
      u.uDecay.value = 0.7;
      this.pass(gl, 8, pressure.write, pressure.read.texture);
      pressure.swap();
      for (let i = 0; i < (low ? 8 : 12); i++) {
        this.pass(
          gl,
          6,
          pressure.write,
          pressure.read.texture,
          this.divergence!.texture,
        );
        pressure.swap();
      }
      this.pass(gl, 7, velocity.write, pressure.read.texture);
      velocity.swap();
      u.uVelocity.value = velocity.read.texture;
      u.uDecay.value = Math.exp(-decayDt * 1.05);
      this.pass(gl, 0, dye.write, dye.read.texture);
      dye.swap();
      this.steps++;
    } finally {
      gl.setRenderTarget(previousTarget);
      gl.setClearColor(this.clearColor, alpha);
      gl.autoClear = autoClear;
    }
  }
  /** Explicit development probe only; never read pixels in the animation loop. */
  inspect(gl: WebGLRenderer, x: number, y: number) {
    if (!this.velocity || !this.dye || !this.curl) return null;
    const velocity = new Uint16Array(
      this.velocity.read.width * this.velocity.read.height * 4,
    );
    const curl = new Uint16Array(velocity.length);
    const ink = new Uint16Array(4);
    gl.readRenderTargetPixels(
      this.velocity.read,
      0,
      0,
      this.velocity.read.width,
      this.velocity.read.height,
      velocity,
    );
    gl.readRenderTargetPixels(
      this.curl,
      0,
      0,
      this.curl.width,
      this.curl.height,
      curl,
    );
    gl.readRenderTargetPixels(
      this.dye.read,
      Math.min(
        this.dye.read.width - 1,
        Math.max(0, Math.floor(x * this.dye.read.width)),
      ),
      Math.min(
        this.dye.read.height - 1,
        Math.max(0, Math.floor(y * this.dye.read.height)),
      ),
      1,
      1,
      ink,
    );
    let minX = 0,
      maxX = 0,
      minY = 0,
      maxY = 0,
      curlEnergy = 0;
    for (let i = 0; i < velocity.length; i += 4) {
      const vx = DataUtils.fromHalfFloat(velocity[i]),
        vy = DataUtils.fromHalfFloat(velocity[i + 1]);
      minX = Math.min(minX, vx);
      maxX = Math.max(maxX, vx);
      minY = Math.min(minY, vy);
      maxY = Math.max(maxY, vy);
      curlEnergy += Math.abs(DataUtils.fromHalfFloat(curl[i]));
    }
    return {
      minX,
      maxX,
      minY,
      maxY,
      curlEnergy,
      ink: [0, 1, 2].map((i) => DataUtils.fromHalfFloat(ink[i])),
    };
  }
  dispose() {
    for (const target of this.targets()) target?.dispose();
    this.material.dispose();
    this.geometry.dispose();
    this.empty.dispose();
  }
}
