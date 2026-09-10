"use client";

import Image from "next/image";
import { useReducer } from "react";
import { ImageOff, LoaderCircle, RotateCcw } from "lucide-react";
import { MediaPlaceholder } from "@/components/media/MediaPlaceholder";
import type { CommerceImage, CommerceMedia } from "@/types/commerce";
import { cn } from "@/lib/utils/cn";
import {
  createProductGalleryState,
  productGalleryReducer,
} from "./product-gallery-state";

type Props = {
  title: string;
  images: CommerceImage[];
  media?: CommerceMedia[];
  labels: {
    gallery: string;
    noMedia: string;
    mediaError: string;
    retry: string;
  };
};

export function ProductGallery({ title, images, media = [], labels }: Props) {
  const list =
    media.length > 0
      ? media
      : images.length > 0
        ? images.map((image) => ({ ...image, kind: "image" as const }))
        : [];
  const [state, dispatch] = useReducer(
    productGalleryReducer,
    list[0]?.url ?? null,
    createProductGalleryState,
  );
  const current = list[Math.min(state.active, list.length - 1)] ?? list[0];

  if (!current) {
    return (
      <MediaPlaceholder
        label={labels.noMedia}
        className="aspect-[4/5] rounded-2xl"
      />
    );
  }

  const selectMedia = (index: number, source: string) => {
    dispatch({ type: "select", index, source });
  };

  const markLoaded = () => dispatch({ type: "loaded", source: current.url });
  const markFailed = () => dispatch({ type: "failed", source: current.url });

  return (
    <div
      className={cn(
        "grid gap-3",
        list.length > 1 && "sm:grid-cols-[5.25rem_1fr]",
      )}
      aria-label={labels.gallery}
    >
      {list.length > 1 ? (
        <ul className="order-2 grid grid-cols-4 content-start gap-2 sm:order-1 sm:grid-cols-1">
          {list.slice(0, 5).map((image, index) => (
            <li key={`${image.url}-${index}`}>
              <button
                type="button"
                onClick={() => selectMedia(index, image.url)}
                className={cn(
                  "bg-warm relative aspect-square w-full overflow-hidden rounded-lg border transition-colors",
                  index === state.active
                    ? "border-forest"
                    : "hover:border-forest/30 border-transparent",
                )}
                aria-label={`${title} ${index + 1}`}
                aria-current={index === state.active}
              >
                {state.failedThumbnails.has(image.url) ? (
                  <span className="text-muted flex size-full items-center justify-center">
                    <ImageOff
                      aria-hidden
                      className="size-5"
                      strokeWidth={1.5}
                    />
                  </span>
                ) : image.kind === "video" ? (
                  image.poster ? (
                    <Image
                      src={image.poster.url}
                      alt={image.poster.altText || image.altText || title}
                      fill
                      className="object-cover object-top"
                      sizes="84px"
                      onError={() =>
                        dispatch({ type: "thumbnailFailed", source: image.url })
                      }
                    />
                  ) : (
                    <video
                      src={image.url}
                      muted
                      playsInline
                      preload="metadata"
                      aria-hidden
                      className="h-full w-full object-cover object-top"
                      onError={() =>
                        dispatch({ type: "thumbnailFailed", source: image.url })
                      }
                    />
                  )
                ) : (
                  <Image
                    src={image.url}
                    alt={image.altText || title}
                    fill
                    className="object-cover object-top"
                    sizes="84px"
                    onError={() =>
                      dispatch({ type: "thumbnailFailed", source: image.url })
                    }
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="bg-warm relative order-1 aspect-[4/5] overflow-hidden rounded-2xl sm:order-2">
        {state.failedSource === current.url ? (
          <div className="text-muted absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <ImageOff aria-hidden className="size-10" strokeWidth={1.5} />
            <p className="text-sm">{labels.mediaError}</p>
            <button
              type="button"
              onClick={() => dispatch({ type: "retry", source: current.url })}
              className="border-border bg-card text-text-black inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold"
            >
              <RotateCcw aria-hidden className="size-4" />
              {labels.retry}
            </button>
          </div>
        ) : current.kind === "video" ? (
          current.embedUrl ? (
            <iframe
              key={`${current.url}-${state.retryCount}`}
              src={current.embedUrl}
              title={title}
              loading="lazy"
              allow="fullscreen; picture-in-picture"
              className="h-full w-full border-0"
              onLoad={markLoaded}
              onError={markFailed}
            />
          ) : (
            <video
              key={`${current.url}-${state.retryCount}`}
              src={current.url}
              poster={current.poster?.url ?? undefined}
              controls
              preload="metadata"
              playsInline
              className="h-full w-full object-cover object-top"
              aria-label={current.altText || title}
              onCanPlay={markLoaded}
              onError={markFailed}
            />
          )
        ) : (
          <Image
            key={`${current.url}-${state.retryCount}`}
            src={current.url}
            alt={current.altText || title}
            fill
            priority
            className="object-cover object-top"
            sizes="(max-width: 1024px) 100vw, 50vw"
            onLoad={markLoaded}
            onError={markFailed}
          />
        )}
        {state.loadingSource === current.url &&
        state.failedSource !== current.url ? (
          <div className="bg-warm/80 text-muted pointer-events-none absolute inset-0 flex items-center justify-center">
            <LoaderCircle
              aria-hidden
              className="size-8 animate-spin"
              strokeWidth={1.5}
            />
            <span className="sr-only">{labels.gallery}</span>
          </div>
        ) : null}
        {state.failedSource !== current.url &&
        "caption" in current &&
        current.caption ? (
          <p className="bg-card/90 absolute inset-x-0 bottom-0 px-3 py-2 text-xs">
            {current.caption}
          </p>
        ) : null}
      </div>
    </div>
  );
}
