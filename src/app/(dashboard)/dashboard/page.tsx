import { redirect } from "next/navigation";
import { Users, Target, Handshake, DollarSign, CheckSquare, CalendarClock } from "lucide-react";
import { getCurrentMembership } from "@/lib/current-membership";
import { getDashboardData } from "@/features/dashboard/actions/get-dashboard-data";
import { formatMoney, formatNumber } from "@/lib/format";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { PipelineOverview } from "@/features/dashboard/components/pipeline-overview";
import { RevenueChart } from "@/features/dashboard/components/revenue-chart";
import { ConversionChart } from "@/features/dashboard/components/conversion-chart";
import { SalesTrendChart } from "@/features/dashboard/components/sales-trend-chart";
import { CustomerGrowthChart } from "@/features/dashboard/components/customer-growth-chart";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const data = await getDashboardData(membership.organization.id);
  const { stats } = data;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {membership.user.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening at {membership.organization.name}.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total customers" value={formatNumber(stats.totalCustomers)} icon={Users} />
        <StatCard label="Active leads" value={formatNumber(stats.activeLeads)} icon={Target} accent="brand" />
        <StatCard label="Won deals" value={formatNumber(stats.wonDeals)} icon={Handshake} accent="success" />
        <StatCard label="Revenue" value={formatMoney(stats.revenue, { compact: true })} icon={DollarSign} accent="success" />
        <StatCard label="Tasks due today" value={formatNumber(stats.tasksDueToday)} icon={CheckSquare} accent="warning" />
        <StatCard label="Upcoming meetings" value={formatNumber(stats.upcomingMeetings)} icon={CalendarClock} />
      </div>

      <PipelineOverview pipeline={data.pipeline} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly revenue</CardTitle>
            <CardDescription>Payments collected over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={data.charts.revenueByMonth} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>Lead conversion</CardTitle>
              <CardDescription>Leads by pipeline stage</CardDescription>
            </div>
            <Badge variant="brand">{data.conversionRate}% win rate</Badge>
          </CardHeader>
          <CardContent>
            <ConversionChart data={data.pipeline} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales trend</CardTitle>
            <CardDescription>Deals won per month</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesTrendChart data={data.charts.salesByMonth} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer growth</CardTitle>
            <CardDescription>Total customers over time</CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerGrowthChart data={data.charts.customerGrowth} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
