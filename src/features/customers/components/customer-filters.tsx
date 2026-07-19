"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { customerStatusValues } from "@/features/customers/schemas/customer-schemas";

const STATUS_LABELS: Record<string, string> = {
  LEAD: "Lead",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  CHURNED: "Churned",
};

export function CustomerFilters({ q, status }: { q?: string; status?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = React.useState(q ?? "");

  function updateParam(key: string, val: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (val) params.set(key, val);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  React.useEffect(() => {
    const handle = setTimeout(() => {
      if (value !== (q ?? "")) updateParam("q", value);
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search name, email, company…"
          className="pl-8"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Select value={status ?? "all"} onValueChange={(v) => updateParam("status", v === "all" ? "" : v)}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {customerStatusValues.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
