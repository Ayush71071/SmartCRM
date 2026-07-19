import { Check, Minus } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const ROWS: { capability: string; owner: boolean; manager: boolean; salesRep: boolean; support: boolean }[] = [
  { capability: "View customers, leads, tasks, meetings", owner: true, manager: true, salesRep: true, support: true },
  { capability: "Create customers, leads, tasks, meetings, deals", owner: true, manager: true, salesRep: true, support: false },
  { capability: "Edit or delete records they don't own", owner: true, manager: true, salesRep: false, support: false },
  { capability: "Use AI tools", owner: true, manager: true, salesRep: true, support: true },
  { capability: "Manage products, invoices & payments", owner: true, manager: true, salesRep: true, support: false },
  { capability: "Invite team members", owner: true, manager: true, salesRep: false, support: false },
  { capability: "Change member roles / remove members", owner: true, manager: false, salesRep: false, support: false },
  { capability: "Change billing plan", owner: true, manager: false, salesRep: false, support: false },
];

function Cell({ value }: { value: boolean }) {
  return value ? <Check className="size-4 text-success" /> : <Minus className="size-4 text-muted-foreground" />;
}

export function PermissionsReference() {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Capability</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Sales Rep</TableHead>
            <TableHead>Support</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((row) => (
            <TableRow key={row.capability}>
              <TableCell className="font-medium">{row.capability}</TableCell>
              <TableCell>
                <Cell value={row.owner} />
              </TableCell>
              <TableCell>
                <Cell value={row.manager} />
              </TableCell>
              <TableCell>
                <Cell value={row.salesRep} />
              </TableCell>
              <TableCell>
                <Cell value={row.support} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
