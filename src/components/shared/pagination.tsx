import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  makeHref,
}: {
  page: number;
  totalPages: number;
  makeHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        {hasPrev ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={makeHref(page - 1)}>
              <ChevronLeft />
              Previous
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft />
            Previous
          </Button>
        )}
        {hasNext ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={makeHref(page + 1)}>
              Next
              <ChevronRight />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRight />
          </Button>
        )}
      </div>
    </div>
  );
}
