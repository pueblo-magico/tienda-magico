"use client";

import {
  Slider as AriaSlider,
  SliderFill,
  SliderThumb,
  SliderTrack,
  type SliderProps as AriaSliderProps,
} from "react-aria-components";
import { cn } from "@/lib/utils/cn";

export type SliderProps = Omit<
  AriaSliderProps<number[]>,
  "children" | "className"
> & {
  className?: string;
  thumbLabels?: [string, string];
};

export function Slider({ className, thumbLabels, ...props }: SliderProps) {
  return (
    <AriaSlider className={cn("w-full", className)} {...props}>
      <SliderTrack className="relative h-1 w-full">
        <div className="bg-border absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full" />
        <SliderFill className="bg-brand absolute top-1/2 h-1 -translate-y-1/2 rounded-full" />
        <SliderThumb
          index={0}
          aria-label={thumbLabels?.[0]}
          className="border-brand bg-card data-[dragging]:ring-brand/30 data-[focus-visible]:ring-brand/30 top-1/2 size-4 rounded-full border-2 outline-none data-[dragging]:ring-4 data-[focus-visible]:ring-4"
        />
        <SliderThumb
          index={1}
          aria-label={thumbLabels?.[1]}
          className="border-brand bg-card data-[dragging]:ring-brand/30 data-[focus-visible]:ring-brand/30 top-1/2 size-4 rounded-full border-2 outline-none data-[dragging]:ring-4 data-[focus-visible]:ring-4"
        />
      </SliderTrack>
    </AriaSlider>
  );
}
