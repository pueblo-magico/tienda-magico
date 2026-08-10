"use client";

import Image from "next/image";
import { useState } from "react";
import type { CommerceImage } from "@/types/commerce";
import { cn } from "@/lib/utils/cn";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80";

type Props = {
  title: string;
  images: CommerceImage[];
  labels: {
    gallery: string;
  };
};

export function ProductGallery({ title, images, labels }: Props) {
  const list =
    images.length > 0
      ? images
      : [{ url: PLACEHOLDER, altText: title, width: null, height: null }];
  const [active, setActive] = useState(0);
  const current = list[Math.min(active, list.length - 1)] ?? list[0];

  return (
    <div className="space-y-3" aria-label={labels.gallery}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-sand/40">
        <Image
          src={current.url || PLACEHOLDER}
          alt={current.altText || title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      {list.length > 1 ? (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {list.map((image, index) => (
            <li key={`${image.url}-${index}`}>
              <button
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  "relative aspect-square w-full overflow-hidden rounded-xl border bg-sand/30 transition-colors",
                  index === active
                    ? "border-forest"
                    : "border-transparent hover:border-forest/30",
                )}
                aria-label={`${title} ${index + 1}`}
                aria-current={index === active}
              >
                <Image
                  src={image.url || PLACEHOLDER}
                  alt={image.altText || title}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
