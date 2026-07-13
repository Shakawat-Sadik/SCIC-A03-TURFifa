'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  Building2,
  Calendar,
  AlertTriangle,
  MoreHorizontal,
  Search,
  Eye,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/store/use-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

/* ---------- types ---------- */
interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  accountStatus: string;
}

interface AlertRecord {
  id: string;
  type: string;
  userId: string;
  userName?: string;
  description: string;
  createdAt: string;
  resolved: boolean;
}

/* ---------- mock data ---------- */
const roleData = [
  { role: 'Players', count: 21 },
  { role: 'Managers', count: 6 },
  { role: 'Admins', count: 1 },
];

const bookingStatusData = [
  { name: 'Confirmed', value: 8, fill: 'oklch(0.768 0.233 130.85)' },
  { name: 'Completed', value: 5, fill: 'oklch(0.648 0.2 131.684)' },
  { name: 'Cancelled', value: 2, fill: 'oklch(0.577 0.245 27.325)' },
];

/* ---------- helpers ---------- */
const roleBadgeClass: Record<string, string> = {
  player: 'bg-blue-100 text-blue-700 border-blue-200',
  turf_manager: 'bg-green-100 text-green-700 border-green-200',
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
};

const accountStatusBadgeClass: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  limited: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  frozen: 'bg-blue-100 text-blue-700 border-blue-200',
  banned: 'bg-red-100 text-red-700 border-red-200',
};

const alertTypeBadgeClass: Record<string, string> = {
  late_cancel: 'bg-red-100 text-red-700 border-red-200',
  param_dispute: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  fraud: 'bg-red-100 text-red-700 border-red-200',
};

const alertTypeLabel: Record<string, string> = {
  late_cancel: 'Late Cancel',
  param_dispute: 'Parameter Dispute',
  fraud: 'Fraud',
};

function formatLabel(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ====================================================================
   AdminDashboard
   ==================================================================== */
export function AdminDashboard() {
  const user = useAppStore((s) => s.user);
  const navigate = useAppStore((s) => s.navigate);
  const [activeTab, setActiveTab] = useState('audit');

  /* ---------- state ---------- */
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  /* ---------- fetch admin data ---------- */
  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data.users) ? data.users : []);
        setAlerts(
          Array.isArray(data.alerts)
            ? data.alerts.map((a: Record<string, unknown>) => ({
                ...a,
                type: a.alertType ?? a.type,
                userName: a.user?.name ?? a.userName,
              }))
            : []
        );
      }
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  /* ---------- set account status ---------- */
  const setAccountStatus = async (userId: string, accountStatus: string) => {
    try {
      await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, accountStatus }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, accountStatus } : u)),
      );
      toast.success(`User set to ${accountStatus}`);
    } catch {
      toast.error('Failed to update account status');
    }
  };

  /* ---------- resolve alert ---------- */
  const resolveAlert = async (alertId: string) => {
    try {
      await fetch('/api/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolveAlert', alertId }),
      });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)),
      );
      toast.success('Alert resolved');
    } catch {
      toast.error('Failed to resolve alert');
    }
  };

  /* ---------- filtered users ---------- */
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  /* ---------- unresolved alerts ---------- */
  const unresolvedAlerts = alerts.filter((a) => !a.resolved);

  /* ---------- counts ---------- */
  const playerCount = users.filter((u) => u.role === 'player').length;
  const managerCount = users.filter((u) => u.role === 'turf_manager').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  const statusActions = [
    { label: 'Set Active', value: 'active' },
    { label: 'Set Limited', value: 'limited' },
    { label: 'Freeze', value: 'frozen' },
    { label: 'Ban', value: 'banned' },
  ];

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Platform administration &amp; monitoring
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="audit">Global Audit Feed</TabsTrigger>
          <TabsTrigger value="disputes">
            Dispute Center
            {unresolvedAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1">
                {unresolvedAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overview">Platform Overview</TabsTrigger>
        </TabsList>

        {/* ========== TAB 1: Global Audit Feed ========== */}
        <TabsContent value="audit" className="space-y-4">
          {/* Summary counts */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{playerCount}</span>
              <span className="text-muted-foreground">players</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-green-500" />
              <span className="font-medium">{managerCount}</span>
              <span className="text-muted-foreground">managers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-purple-500" />
              <span className="font-medium">{adminCount}</span>
              <span className="text-muted-foreground">admins</span>
            </div>
            <div className="ml-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-8 w-[240px] sm:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 text-center text-muted-foreground">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">No users found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Account Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={roleBadgeClass[u.role] ?? ''}>
                            {formatLabel(u.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={accountStatusBadgeClass[u.accountStatus] ?? ''}>
                            {formatLabel(u.accountStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {statusActions.map((action) => (
                                <DropdownMenuItem
                                  key={action.value}
                                  onClick={() => setAccountStatus(u.id, action.value)}
                                  className={action.value === 'banned' ? 'text-red-600' : ''}
                                >
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== TAB 2: Dispute Center ========== */}
        <TabsContent value="disputes" className="space-y-4">
          <h2 className="text-lg font-semibold">
            Pending Disputes ({unresolvedAlerts.length})
          </h2>

          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading alerts...</div>
          ) : unresolvedAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium text-green-700">No pending disputes. All clear!</p>
                <p className="text-muted-foreground text-sm mt-1">
                  All reported issues have been resolved.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unresolvedAlerts.map((alert) => (
                <Card key={alert.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={alertTypeBadgeClass[alert.type] ?? ''}>
                        {alertTypeLabel[alert.type] ?? formatLabel(alert.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <CardTitle className="text-sm mt-1">
                      {alert.userName ?? `User ${alert.userId}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('profile')}
                      >
                        <Eye className="h-4 w-4" />
                        View User
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ========== TAB 3: Platform Overview ========== */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600' },
              { label: 'Total Venues', value: managerCount, icon: Building2, color: 'text-green-600' },
              { label: 'Active Bookings', value: 8, icon: Calendar, color: 'text-orange-600' },
              { label: 'Pending Alerts', value: unresolvedAlerts.length, icon: AlertTriangle, color: 'text-red-600' },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardDescription>{stat.label}</CardDescription>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart: Users by Role */}
            <Card>
              <CardHeader>
                <CardTitle>User Registration by Role</CardTitle>
                <CardDescription>Distribution of registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roleData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="role" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-border, #e5e7eb)' }} />
                      <Bar
                        dataKey="count"
                        name="Users"
                        fill="var(--color-primary, #16a34a)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart: Booking Status */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Status Distribution</CardTitle>
                <CardDescription>Current breakdown of all bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bookingStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={true}
                      >
                        {bookingStatusData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}