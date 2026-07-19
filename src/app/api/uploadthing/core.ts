import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getCurrentMembership } from "@/lib/current-membership";

const f = createUploadthing();

export const ourFileRouter = {
  customerDocument: f({
    "application/pdf": { maxFileSize: "16MB", maxFileCount: 1 },
    "image/jpeg": { maxFileSize: "8MB", maxFileCount: 1 },
    "image/png": { maxFileSize: "8MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB", maxFileCount: 1 },
    "text/plain": { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const membership = await getCurrentMembership();
      if (!membership) throw new UploadThingError("Not signed in.");
      return { userId: membership.user.id, organizationId: membership.organization.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { userId: metadata.userId, organizationId: metadata.organizationId, url: file.ufsUrl, key: file.key };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
