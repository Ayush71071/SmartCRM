import Link from "next/link";
import { Sparkles, LineChart, KanbanSquare, BotMessageSquare } from "lucide-react";

const FEATURES = [
  { icon: KanbanSquare, text: "Drag-and-drop pipeline that keeps every deal moving" },
  { icon: BotMessageSquare, text: "AI lead scoring, email drafts and meeting summaries" },
  { icon: LineChart, text: "Real revenue, conversion and pipeline analytics" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-brand via-brand to-primary p-10 text-brand-foreground lg:flex">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="size-5" />
          SmartCRM
        </Link>

        <div className="max-w-md space-y-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Run your whole customer pipeline from one clean dashboard.
          </h1>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-brand-foreground/90">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-brand-foreground/70">
          © {new Date().getFullYear()} SmartCRM. Built for small teams that move fast.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-6 p-6 sm:p-10">
        <div className="flex w-full max-w-sm items-center gap-2 lg:hidden">
          <Sparkles className="size-5 text-brand" />
          <span className="text-lg font-semibold">SmartCRM</span>
        </div>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
