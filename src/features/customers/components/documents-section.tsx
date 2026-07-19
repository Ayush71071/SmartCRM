"use client";

import { useRouter } from "next/navigation";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { UploadButton } from "@/lib/uploadthing";
import { recordUploadedDocument, deleteDocument } from "@/features/customers/actions/document-actions";
import { DeleteButton } from "@/components/shared/delete-button";
import { formatDate } from "@/lib/format-date";

type Doc = { id: string; name: string; url: string; mimeType: string; size: number; createdAt: Date };

export function DocumentsSection({
  customerId,
  documents,
  uploadsEnabled,
}: {
  customerId: string;
  documents: Doc[];
  uploadsEnabled: boolean;
}) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      {uploadsEnabled ? (
        <UploadButton
          endpoint="customerDocument"
          onClientUploadComplete={async (res) => {
            const file = res[0];
            if (!file) return;
            const result = await recordUploadedDocument({
              customerId,
              name: file.name,
              url: file.ufsUrl,
              fileKey: file.key,
              mimeType: file.type || "application/octet-stream",
              size: file.size,
            });
            if (!result.ok) toast.error(result.error);
            else {
              toast.success("Document uploaded.");
              router.refresh();
            }
          }}
          onUploadError={(error) => {
            toast.error(error.message);
          }}
        />
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          <Upload className="size-4 shrink-0" />
          File uploads require an <code className="mx-1 rounded bg-muted px-1">UPLOADTHING_TOKEN</code> in .env.
        </div>
      )}

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 p-3">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-2 hover:underline"
              >
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{doc.name}</span>
              </a>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</span>
                <DeleteButton
                  action={() => deleteDocument(doc.id)}
                  confirmMessage={`Delete "${doc.name}"?`}
                  label=""
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
