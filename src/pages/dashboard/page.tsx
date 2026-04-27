import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertTriangle, FileText, Plus, TrendingUp, Users } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTenants } from '@/hooks/use-tenants';
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
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
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
            <Button asChild>
              <Link to="/tenants?add=1">
                <Plus className="size-4" />
                Add Tenant
              </Link>
            </Button>
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

        {/* Recent Tenants */}
        <div className="bg-card border border-border rounded-xl">
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
                    {tenant.name
                      .split(' ')
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
                      Moved in {format(parseISO(tenant.move_in_date), 'dd MMM yyyy')}
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
