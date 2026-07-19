import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function SettingsPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Settings"
      description="Profile, organization and notification settings are coming next."
    />
  );
}
