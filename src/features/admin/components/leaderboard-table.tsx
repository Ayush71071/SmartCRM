import { Trophy } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatMoney } from "@/lib/format";
import type { MemberItem } from "@/features/admin/actions/list-members";

type LeaderboardEntry = { userId: string; wonDeals: number; activeLeads: number; revenue: number };

export function LeaderboardTable({ members, leaderboard }: { members: MemberItem[]; leaderboard: LeaderboardEntry[] }) {
  const rows = leaderboard
    .map((entry) => ({ ...entry, member: members.find((m) => m.userId === entry.userId) }))
    .filter((r) => r.member)
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rank</TableHead>
            <TableHead>Salesperson</TableHead>
            <TableHead>Won deals</TableHead>
            <TableHead>Active leads</TableHead>
            <TableHead>Revenue closed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={row.userId}>
              <TableCell>
                {i === 0 ? <Trophy className="size-4 text-warning" /> : `#${i + 1}`}
              </TableCell>
              <TableCell className="font-medium">{row.member!.user.name}</TableCell>
              <TableCell>{row.wonDeals}</TableCell>
              <TableCell>{row.activeLeads}</TableCell>
              <TableCell>{formatMoney(row.revenue / 100)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
