'use client';

import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Download,
  Eye,
  FileText,
  Mail,
  Pencil,
  Phone,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useTenant } from '@/hooks/use-tenants';
import type { TenantDocument } from '@/types/tenant';
import { TenantFormSheet } from '@/components/tenant-form-sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ============================================================
// Document row
// ============================================================
function DocumentRow({
  doc,
  onView,
}: {
  doc: TenantDocument;
  onView: (doc: TenantDocument) => void;
}) {
  const isViewable =
    doc.mime_type?.startsWith('image/') ||
    doc.mime_type === 'application/pdf' ||
    doc.name.match(/\.(jpeg|jpg|png|gif|webp|pdf)$/i);

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
      <div className="flex items-center justify-center size-9 rounded-lg bg-background border border-border shrink-0">
        <FileText className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
        {doc.size && (
          <p className="text-xs text-muted-foreground">
            {(doc.size / 1024).toFixed(0)} KB
          </p>
        )}
      </div>
      {doc.url && (
        <div className="flex items-center gap-1">
          {isViewable && (
            <Button variant="ghost" mode="icon" size="sm" onClick={() => onView(doc)}>
              <Eye className="size-4" />
            </Button>
          )}
          <a href={doc.url} download={doc.name} target="_blank" rel="noreferrer">
            <Button variant="ghost" mode="icon" size="sm">
              <Download className="size-4" />
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Timeline item
// ============================================================
function TimelineItem({
  label,
  date,
  isLast,
  colour,
}: {
  label: string;
  date: string;
  isLast?: boolean;
  colour: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`size-3 rounded-full mt-1 shrink-0 ${colour}`} />
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>
      <div className="pb-5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{date}</p>
      </div>
    </div>
  );
}

// ============================================================
// Page
// ============================================================
export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: tenant, isLoading } = useTenant(id!);
  const [editOpen, setEditOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<TenantDocument | null>(null);

  if (isLoading) {
    return (
      <div className="container">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-32" />
          <div className="h-48 bg-muted rounded-xl" />
          <div className="h-32 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground text-sm">Tenant not found.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/tenants">
            <ArrowLeft className="size-4 mr-1" /> Back to Tenants
          </Link>
        </Button>
      </div>
    );
  }

  const isActive = !tenant.move_out_date;
  const initials = (tenant.name || '??')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const daysStayed = isActive
    ? (tenant.move_in_date ? differenceInDays(new Date(), parseISO(tenant.move_in_date)) : 0)
    : (tenant.move_in_date && tenant.move_out_date 
        ? differenceInDays(parseISO(tenant.move_out_date), parseISO(tenant.move_in_date)) 
        : 0);

  return (
    <>
      <Helmet>
        <title>{tenant.name} — Roofly</title>
      </Helmet>

      <div className="container space-y-6">
        {/* Back link */}
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/tenants">
              <ArrowLeft className="size-4 mr-1" />
              All Tenants
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Profile */}
          <div className="lg:col-span-2 space-y-5">
            {/* Profile card */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Large avatar */}
                  <div className="flex items-center justify-center size-16 rounded-2xl bg-primary/10 text-primary font-bold text-xl shrink-0">
                    {initials}
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-foreground">{tenant.name}</h1>
                    <Badge
                      variant={isActive ? 'success' : 'secondary'}
                      appearance="light"
                      size="md"
                      className="mt-1.5"
                    >
                      {isActive ? 'Currently Living' : 'Moved Out'}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="size-3.5 mr-1" />
                  Edit
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="size-3" /> Days stayed
                  </p>
                  <p className="text-xl font-bold text-foreground mt-0.5">{daysStayed}</p>
                </div>
                {tenant.phone && (
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="size-3" /> Phone
                    </p>
                    <p className="text-sm font-medium text-foreground mt-0.5">{tenant.phone}</p>
                  </div>
                )}
                {tenant.email && (
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Mail className="size-3" /> Email
                    </p>
                    <p className="text-sm font-medium text-foreground mt-0.5 truncate">
                      {tenant.email}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-card border border-border rounded-xl">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  Documents
                  {(tenant.documents?.length ?? 0) > 0 && (
                    <span className="ml-2 text-muted-foreground font-normal">
                      ({tenant.documents!.length})
                    </span>
                  )}
                </h2>
              </div>
              {!tenant.documents || tenant.documents.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No documents uploaded</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setEditOpen(true)}
                  >
                    Upload Documents
                  </Button>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {tenant.documents.map((doc) => (
                    <DocumentRow key={doc.id} doc={doc} onView={setViewingDoc} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right — Timeline */}
          <div>
            <div className="bg-card border border-border rounded-xl">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Tenancy Timeline</h2>
              </div>
              <div className="p-5">
                <TimelineItem
                  label="Move-In Date"
                  date={tenant.move_in_date ? format(parseISO(tenant.move_in_date), 'EEEE, dd MMMM yyyy') : 'No move-in date set'}
                  colour="bg-emerald-500"
                />
                <TimelineItem
                  label={isActive ? 'Present' : 'Move-Out Date'}
                  date={
                    isActive
                      ? 'Currently living at the property'
                      : (tenant.move_out_date ? format(parseISO(tenant.move_out_date), 'EEEE, dd MMMM yyyy') : 'No move-out date set')
                  }
                  isLast
                  colour={isActive ? 'bg-blue-500' : 'bg-zinc-400'}
                />
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-card border border-border rounded-xl mt-4">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Record Info</h2>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Added</span>
                  <span className="text-foreground font-medium">
                    {tenant.created_at ? format(parseISO(tenant.created_at), 'dd MMM yyyy') : 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last updated</span>
                  <span className="text-foreground font-medium">
                    {tenant.updated_at ? format(parseISO(tenant.updated_at), 'dd MMM yyyy') : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Sheet */}
      <TenantFormSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        tenant={tenant}
      />

      {/* Document Viewer Modal */}
      <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
        <DialogContent variant="fullscreen" className="flex flex-col bg-background/95 backdrop-blur-md border-0 p-4 sm:p-6 lg:p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-foreground">{viewingDoc?.name}</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex-1 overflow-hidden rounded-xl border border-border bg-muted/30">
            {viewingDoc && viewingDoc.url && (
              viewingDoc.mime_type?.startsWith('image/') || viewingDoc.name.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                <div className="flex items-center justify-center w-full h-full p-4">
                  <img src={viewingDoc.url} alt={viewingDoc.name} className="max-w-full max-h-full object-contain" />
                </div>
              ) : viewingDoc.mime_type === 'application/pdf' || viewingDoc.name.toLowerCase().endsWith('.pdf') ? (
                <iframe src={viewingDoc.url} title={viewingDoc.name} className="w-full h-full border-0 rounded-xl" />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Preview not available for this file type.
                </div>
              )
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
