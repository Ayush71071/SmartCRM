"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, ListChecks, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { suggestTasksAction } from "@/features/ai/actions/suggest-tasks";
import { createTask } from "@/features/tasks/actions/task-actions";

type CustomerOption = { id: string; name: string; company: string | null };
type Suggestion = { action: string; reason: string };

export function TaskSuggestionsPanel({ customers }: { customers: CustomerOption[] }) {
  const router = useRouter();
  const [customerId, setCustomerId] = React.useState(customers[0]?.id ?? "");
  const [loading, setLoading] = React.useState(false);
  const [addingIndex, setAddingIndex] = React.useState<number | null>(null);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [added, setAdded] = React.useState<Set<number>>(new Set());

  async function handleSuggest() {
    if (!customerId) return;
    setLoading(true);
    const res = await suggestTasksAction(customerId);
    setLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setSuggestions(res.data.suggestions);
    setAdded(new Set());
  }

  async function handleAdd(index: number, suggestion: Suggestion) {
    setAddingIndex(index);
    const result = await createTask({
      title: suggestion.action,
      description: suggestion.reason,
      priority: "MEDIUM",
      recurrence: "NONE",
      customerId,
    });
    setAddingIndex(null);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setAdded((prev) => new Set(prev).add(index));
    toast.success("Added to tasks.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="size-4" />
          AI Task Suggestions
        </CardTitle>
        <CardDescription>Recommended next actions based on recent activity with a customer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {customers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add a customer first.</p>
        ) : (
          <>
            <Select
              value={customerId}
              onValueChange={(v) => {
                setCustomerId(v);
                setSuggestions([]);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` · ${c.company}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSuggest} disabled={loading} className="w-full">
              {loading && <Loader2 className="animate-spin" />}
              Suggest tasks
            </Button>

            {suggestions.length > 0 && (
              <ul className="space-y-2">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{s.action}</p>
                      <p className="text-xs text-muted-foreground">{s.reason}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={added.has(i) ? "secondary" : "outline"}
                      disabled={addingIndex === i || added.has(i)}
                      onClick={() => handleAdd(i, s)}
                    >
                      {addingIndex === i ? <Loader2 className="animate-spin" /> : added.has(i) ? null : <Plus />}
                      {added.has(i) ? "Added" : "Add"}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
