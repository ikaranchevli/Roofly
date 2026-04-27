import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { format, parseISO } from 'date-fns';
import { Plus, FileText, Calendar, DollarSign, Eye, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useBills, useDeleteBill } from '@/hooks/use-bills';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategories } from '@/hooks/use-categories';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/components/layouts/layout-1/components/toolbar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BillFormSheet } from './components/bill-form-sheet';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import type { Bill } from '@/types/bill';

function BillCard({ bill, onDelete, onEdit, onViewDoc }: { bill: Bill; onDelete: (id: string) => void; onEdit: (bill: Bill) => void; onViewDoc: (bill: Bill) => void }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${bill.category?.color || 'bg-slate-500'}`}>
            <DynamicIcon name={bill.category?.icon} className="size-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-base">
              {bill.category?.name || 'Uncategorised'}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Calendar className="size-3.5" />
              {format(parseISO(bill.start_date), 'dd MMM yyyy')} - {format(parseISO(bill.end_date), 'dd MMM yyyy')}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <div className="text-lg font-bold text-foreground">
            ${bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1">
            {bill.document_url && (
              <Button
                variant="ghost"
                size="sm"
                mode="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                onClick={() => onViewDoc(bill)}
              >
                <Eye className="size-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" mode="icon" className="h-8 w-8">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(bill)}>
                  <Edit2 className="size-4 mr-2" />
                  Edit Bill
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => {
                    if (window.confirm('Delete this bill? This will also delete all calculated splits.')) {
                      onDelete(bill.id);
                    }
                  }}
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete Bill
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {bill.notes && (
        <div className="mb-4 bg-muted/20 p-3 rounded-lg border border-border/50 text-sm text-muted-foreground whitespace-pre-wrap">
          {bill.notes}
        </div>
      )}

      <div className="border-t border-border pt-4">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Tenant Splits
        </h4>
        <div className="space-y-2">
          {bill.splits && bill.splits.length > 0 ? (
            bill.splits.map((split) => (
              <div key={split.id} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                    {split.tenant?.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-foreground">{split.tenant?.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground text-xs">{split.days_stayed} days</span>
                  <span className="font-semibold text-foreground">
                    ${split.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground italic">No active tenants during this period.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function BillsPage() {
  const { data: bills, isLoading } = useBills();
  const { data: categories } = useCategories();
  const deleteBill = useDeleteBill();
  
  const [addOpen, setAddOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Bill | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilterFrom, setDateFilterFrom] = useState<string>('');
  const [dateFilterTo, setDateFilterTo] = useState<string>('');

  const filteredBills = bills?.filter((bill) => {
    if (categoryFilter !== 'all' && bill.category_id !== categoryFilter) return false;
    // Check for overlap: Exclude if bill ends before filter starts, or starts after filter ends
    if (dateFilterFrom && bill.end_date < dateFilterFrom) return false;
    if (dateFilterTo && bill.start_date > dateFilterTo) return false;
    return true;
  });

  const openAddSheet = () => {
    setEditingBill(null);
    setAddOpen(true);
  };

  const openEditSheet = (bill: Bill) => {
    setEditingBill(bill);
    setAddOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Bills — Roofly</title>
      </Helmet>

      <div className="container space-y-6 pb-10">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle>Property Bills</ToolbarPageTitle>
          </ToolbarHeading>
          <ToolbarActions className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap justify-end">
            {isSupabaseConfigured && !isLoading && (bills?.length || 0) > 0 && (
              <>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-[140px] sm:w-[160px] h-9">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground hidden sm:inline-block">From</span>
                    <Input 
                      type="date" 
                      value={dateFilterFrom} 
                      onChange={(e) => setDateFilterFrom(e.target.value)} 
                      className="h-9 w-[130px]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground hidden sm:inline-block">To</span>
                    <Input 
                      type="date" 
                      value={dateFilterTo} 
                      onChange={(e) => setDateFilterTo(e.target.value)} 
                      className="h-9 w-[130px]"
                    />
                  </div>
                </div>
                
                {(categoryFilter !== 'all' || dateFilterFrom || dateFilterTo) && (
                  <Button 
                    variant="ghost" 
                    className="h-9 px-2 text-muted-foreground"
                    onClick={() => {
                      setCategoryFilter('all');
                      setDateFilterFrom('');
                      setDateFilterTo('');
                    }}
                  >
                    Clear
                  </Button>
                )}
              </>
            )}
          </ToolbarActions>
        </Toolbar>

        {!isSupabaseConfigured ? (
          <div className="p-8 text-center bg-muted/30 rounded-xl border border-dashed border-border">
            <DollarSign className="size-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground">Database not configured</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Please connect Supabase to manage bills.
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : !bills || bills.length === 0 ? (
          <div className="p-12 text-center bg-card rounded-xl border border-border">
            <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="size-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">No bills yet</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto mb-6">
              Add your first utility or property bill to automatically split it among your tenants based on their stay duration.
            </p>
            <Button onClick={openAddSheet}>
              <Plus className="size-4 mr-1.5" /> Add First Bill
            </Button>
          </div>
        ) : !filteredBills || filteredBills.length === 0 ? (
          <div className="p-12 text-center bg-card rounded-xl border border-border">
            <h3 className="text-lg font-medium text-foreground">No bills match your filters</h3>
            <Button 
              variant="link" 
              className="mt-2"
              onClick={() => {
                setCategoryFilter('all');
                setDateFilterFrom('');
                setDateFilterTo('');
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onDelete={(id) => deleteBill.mutate(id)}
                onEdit={openEditSheet}
                onViewDoc={setViewingDoc}
              />
            ))}
          </div>
        )}
      </div>

      <BillFormSheet open={addOpen} onOpenChange={setAddOpen} bill={editingBill} />

      {/* Document Viewer Modal */}
      <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
        <DialogContent variant="fullscreen" className="flex flex-col bg-background/95 backdrop-blur-md border-0 p-4 sm:p-6 lg:p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-foreground">{viewingDoc?.category?.name} Bill Document</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex-1 overflow-hidden rounded-xl border border-border bg-muted/30">
            {viewingDoc && viewingDoc.document_url && (
              viewingDoc.document_path?.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                <div className="flex items-center justify-center w-full h-full p-4">
                  <img src={viewingDoc.document_url} alt="Bill Document" className="max-w-full max-h-full object-contain" />
                </div>
              ) : viewingDoc.document_path?.toLowerCase().endsWith('.pdf') ? (
                <iframe src={viewingDoc.document_url} title="Bill Document" className="w-full h-full border-0 rounded-xl" />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Preview not available for this file type.
                </div>
              )
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <Button
        size="icon"
        className="fixed bottom-8 right-8 size-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 z-40"
        onClick={openAddSheet}
        disabled={!isSupabaseConfigured}
      >
        <Plus className="size-6" />
      </Button>
    </>
  );
}
