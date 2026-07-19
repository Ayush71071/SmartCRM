import "server-only";
import { db } from "@/lib/db";

export async function getInvitationByToken(token: string) {
  return db.invitation.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  });
}
