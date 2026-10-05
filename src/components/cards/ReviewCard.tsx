import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import {
  Body as CardDescription,
  Card,
  CardBody as CardContent,
  CardHeader,
  CardTitle,
} from "@pueblo-magico/react-ui";
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
    <Card variant="outlined">
      <CardHeader layout="split">
        <div className="flex items-start gap-4">
          <span aria-hidden className="text-text-secondary shrink-0">
            {icon}
          </span>
          <div>
            <CardTitle>{title}</CardTitle>
            {description ? (
              <CardDescription size="sm">{description}</CardDescription>
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
