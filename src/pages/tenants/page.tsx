'use client';

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { format, parseISO } from 'date-fns';
import { Mail, MoreHorizontal, Pencil, Phone, Plus, Trash2, Users, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useDeleteTenant, useTenants } from '@/hooks/use-tenants';
import type { Tenant } from '@/types/tenant';
import { TenantFormSheet } from '@/components/tenant-form-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/components/layouts/layout-1/components/toolbar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ============================================================
// Tenant Card
// ============================================================
function TenantCard({
  tenant,
  onEdit,
  onDelete,
}: {
  tenant: Tenant;
  onEdit: (t: Tenant) => void;
  onDelete: (t: Tenant) => void;
}) {
  const isActive = !tenant.move_out_date;
  const initials = tenant.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex items-center justify-center size-11 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <Link
              to={`/tenants/${tenant.id}`}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate block"
            >
              {tenant.name}
            </Link>
            <Badge
              variant={isActive ? 'success' : 'secondary'}
              appearance="light"
              size="sm"
              className="mt-1"
            >
              {isActive ? 'Active' : 'Moved Out'}
            </Badge>
          </div>
        </div>

        {/* Actions menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              mode="icon"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/tenants/${tenant.id}`}>View Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(tenant)}>
              <Pencil className="size-3.5 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(tenant)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="size-3.5 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-muted/50 rounded-lg p-2.5">
          <p className="text-muted-foreground mb-0.5">Move In</p>
          <p className="font-medium text-foreground">
            {format(parseISO(tenant.move_in_date), 'dd MMM yyyy')}
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-2.5">
          <p className="text-muted-foreground mb-0.5">Move Out</p>
          <p className="font-medium text-foreground">
            {tenant.move_out_date
              ? format(parseISO(tenant.move_out_date), 'dd MMM yyyy')
              : 'Present'}
          </p>
        </div>
      </div>

      {/* Contact */}
      {(tenant.phone || tenant.email) && (
        <div className="flex flex-col gap-1.5 text-xs">
          {tenant.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="size-3 shrink-0" />
              <span>{tenant.phone}</span>
            </div>
          )}
          {tenant.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="size-3 shrink-0" />
              <span className="truncate">{tenant.email}</span>
            </div>
          )}
        </div>
      )}

      {/* Documents badge */}
      {(tenant.documents?.length ?? 0) > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
            📎 {tenant.documents!.length} document{tenant.documents!.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Empty state
// ============================================================
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10 mb-4">
        <Users className="size-7 text-primary" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">No tenants yet</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-xs">
        Add your first tenant to start managing your household.
      </p>
      <Button onClick={onAdd}>
        <Plus className="size-4" />
        Add First Tenant
      </Button>
    </div>
  );
}

// ============================================================
// Page
// ============================================================
export function TenantsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: tenants = [], isLoading } = useTenants();
  const deleteTenant = useDeleteTenant();

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(searchParams.get('add') === '1');
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Tenant | null>(null);

  const [statusFilter, setStatusFilter] = useState<'Active' | 'All' | 'Past'>('Active');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCount = tenants.filter((t) => !t.move_out_date).length;
  const movedOutCount = tenants.filter((t) => !!t.move_out_date).length;

  const filteredTenants = tenants
    .filter((t) => {
      if (statusFilter === 'Active' && t.move_out_date) return false;
      if (statusFilter === 'Past' && !t.move_out_date) return false;
      if (searchQuery && !t.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => parseISO(a.move_in_date).getTime() - parseISO(b.move_in_date).getTime());

  function openAdd() {
    setEditingTenant(null);
    setSheetOpen(true);
  }

  function openEdit(t: Tenant) {
    setEditingTenant(t);
    setSheetOpen(true);
  }

  function handleSheetClose(open: boolean) {
    setSheetOpen(open);
    if (!open) {
      setEditingTenant(null);
      // Clear ?add=1 from URL
      if (searchParams.has('add')) {
        setSearchParams({});
      }
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteTenant.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.name} removed`);
    } catch {
      toast.error('Failed to remove tenant');
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <Helmet>
        <title>Tenants — Roofly</title>
      </Helmet>

      <div className="container space-y-6">
        {/* Toolbar */}
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle>Tenants</ToolbarPageTitle>
            <ToolbarDescription>
              {isLoading ? (
                'Loading…'
              ) : (
                <>
                  <span className="font-medium text-foreground">{activeCount}</span> active ·{' '}
                  <span className="font-medium text-foreground">{movedOutCount}</span> moved out
                </>
              )}
            </ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Type name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full pl-9"
              />
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={(val) => setStatusFilter(val as 'Active' | 'All' | 'Past')}
            >
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Past">Past</SelectItem>
              </SelectContent>
            </Select>
          </ToolbarActions>
        </Toolbar>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-5 h-48 animate-pulse" />
            ))}
          </div>
        ) : filteredTenants.length === 0 ? (
          <EmptyState onAdd={openAdd} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTenants.map((tenant) => (
              <TenantCard
                key={tenant.id}
                tenant={tenant}
                onEdit={openEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Sheet */}
      <TenantFormSheet
        open={sheetOpen}
        onOpenChange={handleSheetClose}
        tenant={editingTenant}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong>{deleteTarget?.name}</strong>? This will permanently delete their record
              and all associated documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTenant.isPending ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button
        size="icon"
        className="fixed bottom-8 right-8 size-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 z-40"
        onClick={openAdd}
      >
        <Plus className="size-6" />
      </Button>
    </>
  );
}
