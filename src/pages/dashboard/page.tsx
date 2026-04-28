import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, FileText, Plus, TrendingUp, Users, Home } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useTenants } from '@/hooks/use-tenants';
import { useHousehold } from '@/hooks/use-household';
import { usePendingProfiles, useApproveProfile } from '@/hooks/use-profiles';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/components/layouts/layout-1/components/toolbar';

function StatCard({
  icon: Icon,
  label,
  value,
  colour,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  colour: string;
}) {
  return (
    <div className="bg-white border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={`flex items-center justify-center size-12 rounded-xl ${colour}`}>
        <Icon className="size-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data: tenants = [], isLoading } = useTenants();
  const { data: household, isLoading: isLoadingHousehold } = useHousehold();
  const { data: pendingProfiles = [], isLoading: isLoadingPending } = usePendingProfiles();
  const approveProfile = useApproveProfile();

  const activeCount = tenants.filter((t) => !t.move_out_date).length;
  const movedOutCount = tenants.filter((t) => !!t.move_out_date).length;

  return (
    <>
      <Helmet>
        <title>Dashboard — Roofly</title>
      </Helmet>

      <div className="container space-y-6">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle>Dashboard</ToolbarPageTitle>
            <ToolbarDescription>Overview of your property</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            {household?.userRole === 'admin' && (
              <Button asChild>
                <Link to="/tenants?add=1">
                  <Plus className="size-4" />
                  Add Tenant
                </Link>
              </Button>
            )}
          </ToolbarActions>
        </Toolbar>

        {/* Supabase setup banner */}
        {!isSupabaseConfigured && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
            <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">Supabase not configured</p>
              <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                Add your <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded text-xs">VITE_SUPABASE_URL</code> and{' '}
                <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded text-xs">VITE_SUPABASE_ANON_KEY</code> to{' '}
                <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded text-xs">.env.local</code> to connect your database.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={Users}
            label="Total Tenants"
            value={isLoading ? '—' : tenants.length}
            colour="bg-blue-500"
          />
          <StatCard
            icon={TrendingUp}
            label="Currently Living"
            value={isLoading ? '—' : activeCount}
            colour="bg-emerald-500"
          />
          <StatCard
            icon={FileText}
            label="Moved Out"
            value={isLoading ? '—' : movedOutCount}
            colour="bg-zinc-400"
          />
        </div>

        {/* Household Info (Admin only) */}
        {!isLoadingHousehold && household && household.userRole === 'admin' && (
          <div className="bg-gradient-to-br from-[#E67E22]/10 to-transparent border border-[#E67E22]/20 rounded-xl p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-900">{household.name}</h3>
                <p className="text-sm text-zinc-500 flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-[#E67E22]"></span>
                  {household.address}
                </p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-2xl p-4 flex items-center gap-6 shadow-sm">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Roofly Key</p>
                  <p className="text-2xl font-black text-zinc-900 tracking-widest">{household.join_code}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(household.join_code);
                    toast.success('Join code copied to clipboard');
                  }}
                  className="bg-[#E67E22] hover:bg-[#D35400] text-white rounded-xl h-10"
                >
                  Copy Code
                </Button>
              </div>
            </div>

            {/* Decorative background element */}
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
              <Home className="size-32" />
            </div>
          </div>
        )}

        {/* Pending Approvals (Admin only) */}
        {household?.userRole === 'admin' && !isLoadingPending && pendingProfiles.length > 0 && (
          <div className="bg-white border-2 border-[#E67E22]/20 rounded-2xl overflow-hidden">
            <div className="bg-[#E67E22]/5 px-5 py-3 border-b border-[#E67E22]/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#E67E22] flex items-center gap-2">
                <Users className="size-4" />
                Join Requests ({pendingProfiles.length})
              </h3>
            </div>
            <div className="divide-y divide-zinc-100">
              {pendingProfiles.map((p: any) => (
                <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 overflow-hidden">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} className="size-full object-cover" />
                      ) : (
                        (p.first_name?.[0] || 'U')
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="text-xs text-zinc-500">{p.phone || 'No phone'}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => approveProfile.mutate(p.id)}
                    disabled={approveProfile.isPending}
                    className="bg-[#E67E22] hover:bg-[#D35400] text-white rounded-xl"
                  >
                    Approve
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Tenants */}
        <div className="bg-white border border-border rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Recent Tenants</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tenants">View all</Link>
            </Button>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
          ) : tenants.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-sm">No tenants yet.</p>
              <Button asChild className="mt-3">
                <Link to="/tenants?add=1">
                  <Plus className="size-4 mr-1" />
                  Add your first tenant
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {tenants.slice(0, 5).map((tenant) => (
                <li key={tenant.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                  {/* Avatar initials */}
                  <div className="flex items-center justify-center size-9 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                    {(tenant.name || '??')
                      .split(' ')
                      .filter(Boolean)
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/tenants/${tenant.id}`}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {tenant.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tenant.move_in_date
                        ? `Moved in ${format(parseISO(tenant.move_in_date), 'dd MMM yyyy')}`
                        : 'No move-in date'}
                    </p>
                  </div>
                  <Badge variant={tenant.move_out_date ? 'secondary' : 'success'} size="sm">
                    {tenant.move_out_date ? 'Moved out' : 'Active'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bills Coming Soon */}
        <div className="bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent border border-blue-200 dark:border-blue-900 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center size-10 rounded-xl bg-blue-500/10 shrink-0">
              <FileText className="size-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Bills — Coming Soon</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Track and split utility bills by the number of days each tenant was at the property.
              </p>
              <Badge variant="secondary" size="sm" className="mt-2">In Development</Badge>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
