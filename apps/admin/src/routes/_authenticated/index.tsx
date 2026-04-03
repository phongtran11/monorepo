import { createFileRoute } from '@tanstack/react-router';
import {
  BarChart3,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@admin/components/ui/card';

export const Route = createFileRoute('/_authenticated/')({
  component: DashboardPage,
});

const stats = [
  {
    title: 'Total Revenue',
    value: '₫24,500,000',
    change: '+12.5%',
    icon: TrendingUp,
    description: 'vs last month',
  },
  {
    title: 'Orders',
    value: '1,234',
    change: '+8.2%',
    icon: ShoppingCart,
    description: 'vs last month',
  },
  {
    title: 'Products',
    value: '456',
    change: '+3.1%',
    icon: Package,
    description: 'total active',
  },
  {
    title: 'Customers',
    value: '8,901',
    change: '+18.7%',
    icon: Users,
    description: 'registered users',
  },
];

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back! Here's what's happening with your store.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-muted-foreground mt-1 text-xs">
                <span className="text-green-600">{stat.change}</span>{' '}
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Monthly revenue for this year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex h-48 items-center justify-center rounded-md border border-dashed">
              <div className="flex flex-col items-center gap-1">
                <BarChart3 className="size-8 opacity-30" />
                <span className="text-sm">Chart coming soon</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest 5 orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground flex h-48 items-center justify-center rounded-md border border-dashed">
              <div className="flex flex-col items-center gap-1">
                <ShoppingCart className="size-8 opacity-30" />
                <span className="text-sm">No recent orders</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
