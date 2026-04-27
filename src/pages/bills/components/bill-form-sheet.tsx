import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Calculator, Upload, Paperclip, X } from 'lucide-react';
import { useCreateBill, useUpdateBill } from '@/hooks/use-bills';
import { useCategories } from '@/hooks/use-categories';
import { useTenants } from '@/hooks/use-tenants';
import { calculateBillSplits, type CalculatedSplit } from '@/lib/billing';
import type { Bill } from '@/types/bill';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const billSchema = z.object({
  category_id: z.string().min(1, 'Please select a category'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  notes: z.string().optional(),
  documentFile: z.instanceof(File).nullable().optional(),
  removeDocument: z.boolean().default(false),
}).refine((data) => data.start_date <= data.end_date, {
  message: "End date cannot be before start date",
  path: ["end_date"],
});

type BillFormValues = z.infer<typeof billSchema>;

interface BillFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill?: Bill | null;
}

export function BillFormSheet({ open, onOpenChange, bill }: BillFormSheetProps) {
  const isEditing = !!bill;
  const { data: categories } = useCategories();
  const { data: tenants } = useTenants();
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();
  
  const [splitsPreview, setSplitsPreview] = useState<CalculatedSplit[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [existingDoc, setExistingDoc] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
  });

  // Watch fields for live calculation
  const amount = watch('amount');
  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const docFile = watch('documentFile');

  useEffect(() => {
    if (open && bill) {
      setExistingDoc(bill.document_path || null);
      reset({
        amount: bill.amount,
        start_date: bill.start_date,
        end_date: bill.end_date,
        notes: bill.notes || '',
        category_id: bill.category_id,
        documentFile: null,
        removeDocument: false,
      });
      // the splits preview will auto calculate via the other useEffect
    } else if (open) {
      setExistingDoc(null);
      reset({ amount: 0, start_date: '', end_date: '', notes: '', category_id: '', documentFile: null, removeDocument: false });
      setSplitsPreview([]);
    }
  }, [open, bill, reset]);

  useEffect(() => {
    if (amount > 0 && startDate && endDate && startDate <= endDate && tenants) {
      const splits = calculateBillSplits(amount, startDate, endDate, tenants);
      setSplitsPreview(splits);
    } else {
      setSplitsPreview([]);
    }
  }, [amount, startDate, endDate, tenants]);

  const onSubmit = async (data: BillFormValues) => {
    if (!tenants || tenants.length === 0) {
      alert('You need at least one tenant to add a bill.');
      return;
    }

    const splits = calculateBillSplits(data.amount, data.start_date, data.end_date, tenants);

    if (splits.length === 0) {
      alert('No tenants were living at the property during this billing cycle. The bill cannot be split.');
      return;
    }

    try {
      if (isEditing && bill) {
        await updateBill.mutateAsync({
          id: bill.id,
          bill: {
            category_id: data.category_id,
            amount: data.amount,
            start_date: data.start_date,
            end_date: data.end_date,
            notes: data.notes || undefined,
          },
          documentFile: data.documentFile,
          removeDocument: data.removeDocument,
          splits: splits.map(s => ({
            tenant_id: s.tenantId,
            amount: s.amount,
            days_stayed: s.daysStayed,
          })),
        });
      } else {
        await createBill.mutateAsync({
          bill: {
            category_id: data.category_id,
            amount: data.amount,
            start_date: data.start_date,
            end_date: data.end_date,
            notes: data.notes || undefined,
          },
          documentFile: data.documentFile,
          splits: splits.map(s => ({
            tenant_id: s.tenantId,
            amount: s.amount,
            days_stayed: s.daysStayed,
          })),
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create bill:', error);
      alert('Failed to save the bill. Please try again.');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border bg-muted/20">
          <SheetTitle>{isEditing ? 'Edit Bill' : 'Add New Bill'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
          <SheetBody className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Category</label>
              <select
                {...register('category_id')}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a category...</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="text-xs text-destructive">{errors.category_id.message}</p>}
              {!categories?.length && (
                <p className="text-xs text-muted-foreground">
                  No categories found. Go to Settings to add some.
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Total Amount ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('amount')}
              />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Start Date</label>
                <Input type="date" {...register('start_date')} />
                {errors.start_date && <p className="text-xs text-destructive">{errors.start_date.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">End Date</label>
                <Input type="date" {...register('end_date')} />
                {errors.end_date && <p className="text-xs text-destructive">{errors.end_date.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Notes (Optional)</label>
              <Textarea
                {...register('notes')}
                placeholder="Add any extra details about this bill..."
                className="resize-none h-20"
              />
              {errors.notes && <p className="text-xs text-destructive">{errors.notes.message}</p>}
            </div>


            {/* Document Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Receipt / Invoice (Optional)</label>
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30',
                )}
                onClick={() => document.getElementById('bill-doc-input')?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files?.length > 0) {
                    setValue('documentFile', e.dataTransfer.files[0]);
                    setValue('removeDocument', false);
                  }
                }}
              >
                <Upload className="mx-auto size-5 text-muted-foreground mb-1.5" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Click to upload</span> or drag and drop
                </p>
                <input
                  id="bill-doc-input"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      setValue('documentFile', e.target.files[0]);
                      setValue('removeDocument', false);
                    }
                  }}
                />
              </div>

              {existingDoc && !watch('removeDocument') && !docFile && (
                <div className="flex items-center gap-2 text-sm px-3 py-2 mt-2 rounded-lg bg-muted/40 group">
                  <Paperclip className="size-3.5 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate">Existing document</span>
                  <button
                    type="button"
                    onClick={() => setValue('removeDocument', true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}

              {docFile && (
                <div className="flex items-center gap-2 text-sm px-3 py-2 mt-2 rounded-lg bg-primary/5 border border-primary/20 group">
                  <Paperclip className="size-3.5 text-primary shrink-0" />
                  <span className="flex-1 truncate text-foreground">{docFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setValue('documentFile', null)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Split Preview */}
            <div className="bg-muted/50 rounded-xl border border-border p-5 mt-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Calculator className="size-4 text-primary" />
                Calculation Preview
              </h3>
              
              {splitsPreview.length > 0 ? (
                <div className="space-y-3">
                  {splitsPreview.map((split) => {
                    const tenant = tenants?.find((t) => t.id === split.tenantId);
                    return (
                      <div key={split.tenantId} className="flex items-center justify-between text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{tenant?.name}</span>
                          <span className="text-xs text-muted-foreground">{split.daysStayed} days</span>
                        </div>
                        <span className="font-semibold text-foreground">
                          ${split.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })}
                  
                  {/* Total Check */}
                  <div className="pt-3 mt-3 border-t border-border flex justify-between font-bold text-sm">
                    <span>Total Allocated</span>
                    <span>
                      ${splitsPreview.reduce((sum, s) => sum + s.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-2">
                  Enter amount and valid dates to see how the bill will be split.
                </p>
              )}
            </div>
          </SheetBody>

          <SheetFooter className="px-6 py-4 border-t border-border bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="mr-2"
              disabled={createBill.isPending || updateBill.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createBill.isPending || updateBill.isPending}>
              {createBill.isPending || updateBill.isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Bill'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
