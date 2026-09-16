"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

export function BackdropImage({
  src,
  sizes,
  className,
}: {
  src: string;
  sizes: string;
  className?: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (failedSource === src) return null;
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      priority
      className={cn("object-cover", className)}
      onError={() => setFailedSource(src)}
    />
  );
}
