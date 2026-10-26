import { useId } from "react";
/** Viewport isolates the exact AKK artwork supplied in the design reference. */
export default function BrandMark() {
  const alphaId = "akk-alpha-" + useId().replaceAll(":", "");
  return (
    <svg
      viewBox="29 18 87 34"
      width="87"
      height="34"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={alphaId} colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .2296 .7724 .078 0 -.08"
          />
        </filter>
      </defs>
      <image
        href="/brand/reference.png"
        width="1376"
        height="768"
        filter={`url(#${alphaId})`}
      />
    </svg>
  );
}
