import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ReviewCard({
  title,
  description,
  icon,
  editHref,
  editLabel,
  children,
}: {
  title: string;
  description?: string;
  icon: ReactNode;
  editHref: string;
  editLabel: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader layout="split">
        <div className="flex items-start gap-4">
          <span aria-hidden className="text-text-secondary shrink-0">
            {icon}
          </span>
          <div>
            <CardTitle variant="editorial">{title}</CardTitle>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>
        </div>
        <Button
          variant="link"
          size="sm"
          href={editHref}
          aria-label={`${editLabel}: ${title}`}
        >
          <Pencil aria-hidden className="size-4" />
          {editLabel}
        </Button>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
