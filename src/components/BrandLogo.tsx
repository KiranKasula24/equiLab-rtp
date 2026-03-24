import Image from "next/image";
import { useState } from "react";

type BrandLogoProps = {
  size?: number;
  showWordmark?: boolean;
  showTag?: boolean;
  wordmarkSize?: number;
};

export default function BrandLogo({
  size = 40,
  showWordmark = true,
  showTag = false,
  wordmarkSize = 22,
}: BrandLogoProps) {
  const [src, setSrc] = useState("/brand-logo.png");

  return (
    <div className="brand-lockup">
      <Image
        src={src}
        alt="EquiLab logo"
        width={size}
        height={size}
        priority
        className="brand-logo-image"
        onError={() => setSrc("/brand-logo.svg")}
      />
      {showWordmark && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="brand-wordmark" style={{ fontSize: wordmarkSize }}>
            EquiLab
          </span>
          {showTag && <span className="brand-chip">LIVE</span>}
        </div>
      )}
    </div>
  );
}
