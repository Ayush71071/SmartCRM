"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pin } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addNote } from "@/features/customers/actions/customer-actions";
import { formatDateTime } from "@/lib/format-date";

type NoteItem = {
  id: string;
  content: string;
  pinned: boolean;
  createdAt: Date;
  createdBy: { name: string };
};

export function NotesSection({ customerId, notes }: { customerId: string; notes: NoteItem[] }) {
  const router = useRouter();
  const [content, setContent] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!content.trim()) return;
    setSubmitting(true);
    const result = await addNote({ customerId, content });
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setContent("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          rows={3}
          placeholder="Add a note about this customer…"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button size="sm" onClick={submit} disabled={submitting || !content.trim()}>
          {submitting && <Loader2 className="animate-spin" />}
          Add note
        </Button>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {note.createdBy.name} · {formatDateTime(note.createdAt)}
                </span>
                {note.pinned && <Pin className="size-3.5 text-brand" />}
              </div>
              <p className="mt-1.5 text-sm whitespace-pre-wrap">{note.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
