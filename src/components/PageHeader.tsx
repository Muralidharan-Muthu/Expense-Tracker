import type { ReactNode } from "react";

export function PageHeader({ title, description, eyebrow, actions }: { title: string; description: string; eyebrow?: string; actions?: ReactNode }) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="text-sm font-medium text-primary">{eyebrow}</p> : null}
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
