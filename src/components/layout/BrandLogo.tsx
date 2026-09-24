"use client";

import Image from "next/image";
import { useState } from "react";
import { defaultBrand } from "@/config/brand";
import type { CommerceImage } from "@/types/commerce";

export function BrandLogo({
  logo,
  name = defaultBrand.name,
  className,
  priority = false,
}: {
  logo?: CommerceImage | null;
  name?: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const image = logo?.url !== failed ? logo : null;
  return (
    <Image
      src={image?.url ?? defaultBrand.logo}
      alt={image?.altText || name}
      width={image?.width ?? 134}
      height={image?.height ?? 65}
      className={className}
      priority={priority}
      unoptimized
      onError={() => setFailed(logo?.url ?? null)}
    />
  );
}
