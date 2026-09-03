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
    <div
      className={cn(
        "grid gap-3",
        list.length > 1 && "sm:grid-cols-[5.25rem_1fr]",
      )}
      aria-label={labels.gallery}
    >
      {list.length > 1 ? (
        <ul className="order-2 grid grid-cols-4 gap-2 sm:order-1 sm:grid-cols-1">
          {list.slice(0, 5).map((image, index) => (
            <li key={`${image.url}-${index}`}>
              <button
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  "bg-warm relative aspect-square w-full overflow-hidden rounded-lg border transition-colors",
                  index === active
                    ? "border-forest"
                    : "hover:border-forest/30 border-transparent",
                )}
                aria-label={`${title} ${index + 1}`}
                aria-current={index === active}
              >
                <Image
                  src={image.url || PLACEHOLDER}
                  alt={image.altText || title}
                  fill
                  className="object-cover"
                  sizes="84px"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="bg-warm relative order-1 aspect-[4/5] overflow-hidden rounded-2xl sm:order-2">
        <Image
          src={current.url || PLACEHOLDER}
          alt={current.altText || title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </div>
    </div>
  );
}
