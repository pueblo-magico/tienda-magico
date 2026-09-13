import { ImageBrokenIcon } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  className?: string;
};

export function MediaPlaceholder({ label, className }: Props) {
  return (
    <div
      className={cn(
        "bg-warm text-muted flex size-full flex-col items-center justify-center gap-3 px-6 text-center",
        className,
      )}
      role="img"
      aria-label={label}
    >
      <ImageBrokenIcon aria-hidden className="size-10" weight="light" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
