import { MobileNav } from "@/components/layout/mobile-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

export function Topbar({
  isAdmin,
  orgName,
  userName,
  userEmail,
  userImage,
}: {
  isAdmin: boolean;
  orgName: string;
  userName: string;
  userEmail: string;
  userImage?: string | null;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <MobileNav isAdmin={isAdmin} />
        <span className="text-sm font-medium text-muted-foreground">{orgName}</span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu name={userName} email={userEmail} image={userImage} />
      </div>
    </header>
  );
}
