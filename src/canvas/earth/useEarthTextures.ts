import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import {
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  TextureLoader,
} from "three";

type EarthUniforms = {
  uDay: { value: Texture };
  uNight: { value: Texture };
  uHasDay: { value: number };
  uHasNight: { value: number };
};

/** Texture detail follows GPU capability, independently of animation quality. */
export default function useEarthTextures(uniforms: EarthUniforms) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    let live = true,
      signalled = false;
    const owned = new Set<Texture>([
      uniforms.uDay.value,
      uniforms.uNight.value,
    ]);
    const loader = new TextureLoader();
    const ready = () => {
      if (live && !signalled) {
        signalled = true;
        window.dispatchEvent(new Event("world-ready"));
      }
    };
    const load = (url: string) =>
      new Promise<Texture | null>((resolve) => {
        loader.load(
          url,
          (texture) => {
            if (!live) {
              texture.dispose();
              resolve(null);
              return;
            }
            texture.colorSpace = SRGBColorSpace;
            texture.wrapS = RepeatWrapping;
            texture.wrapT = ClampToEdgeWrapping;
            texture.minFilter = LinearMipmapLinearFilter;
            texture.magFilter = LinearFilter;
            texture.generateMipmaps = true;
            texture.anisotropy = Math.min(
              16,
              gl.capabilities.getMaxAnisotropy(),
            );
            // Upload before swapping: the preview remains rendered while decoding.
            gl.initTexture(texture);
            owned.add(texture);
            resolve(texture);
          },
          undefined,
          () => resolve(null),
        );
      });
    const install = (key: "uDay" | "uNight", texture: Texture) => {
      const old = uniforms[key].value;
      uniforms[key].value = texture;
      uniforms[key === "uDay" ? "uHasDay" : "uHasNight"].value = 1;
      old.dispose();
      owned.delete(old);
    };
    void (async () => {
      const preview = await load("/textures/earth-day-2k.webp");
      if (!live) return;
      if (preview) install("uDay", preview);
      ready(); // Fog clears over a painted preview, never waits for the 8K map.
      for (const size of [8192, 4096]) {
        if (size > gl.capabilities.maxTextureSize) continue;
        const texture = await load(
          `/textures/earth-day-${size === 8192 ? "8k" : "4k"}.webp`,
        );
        if (!live) return;
        if (texture) {
          install("uDay", texture);
          break;
        }
      }
    })();
    void load("/textures/earth-night-2k.webp").then((texture) => {
      if (live && texture) install("uNight", texture);
    });
    return () => {
      live = false;
      owned.forEach((texture) => texture.dispose());
    };
  }, [gl, uniforms]);
}
