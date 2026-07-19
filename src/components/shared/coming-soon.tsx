import type { LucideIcon } from "lucide-react";

export function ComingSoon({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
