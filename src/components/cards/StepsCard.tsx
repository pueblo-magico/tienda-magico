import type { ReactNode } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";

type Step = { id: string; icon: ReactNode; title: string; description: string };

export function StepsCard({
  title,
  description,
  steps,
}: {
  title: string;
  description: string;
  steps: Step[];
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-text-secondary font-serif text-2xl font-normal sm:text-3xl">
          {title}
        </CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-0">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className="group relative flex gap-4 pb-8 last:pb-0 sm:gap-6"
            >
              {index < steps.length - 1 ? (
                <span
                  aria-hidden
                  className="border-border absolute top-10 bottom-0 left-5 border-l border-dashed"
                />
              ) : null}
              <div className="relative flex w-10 shrink-0 justify-center">
                <span
                  aria-hidden
                  className="bg-warm text-text-secondary relative flex size-10 items-center justify-center rounded-full text-xl font-bold"
                >
                  {index + 1}
                </span>
              </div>
              <span
                aria-hidden
                className="text-text-secondary hidden shrink-0 pt-2 sm:block"
              >
                {step.icon}
              </span>
              <div className="min-w-0 pt-1">
                <h3 className="text-text-secondary font-serif text-xl">
                  {step.title}
                </h3>
                <p className="text-text-primary mt-1 text-base leading-relaxed">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
