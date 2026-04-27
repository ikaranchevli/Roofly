'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Paperclip, Trash2, Upload, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useCreateTenant, useUpdateTenant } from '@/hooks/use-tenants';
import type { Tenant } from '@/types/tenant';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// ============================================================
// Validation schema
// ============================================================
const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    move_in_date: z.string().min(1, 'Move-in date is required'),
    currently_living: z.boolean(),
    move_out_date: z.string().nullable().optional(),
    phone: z.string().optional(),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    new_documents: z.array(z.instanceof(File)).default([]),
    removed_document_ids: z.array(z.string()).default([]),
  })
  .refine(
    (data) => {
      if (!data.currently_living && !data.move_out_date) {
        return false;
      }
      return true;
    },
    {
      message: 'Move-out date is required when tenant has moved out',
      path: ['move_out_date'],
    },
  );

type FormValues = z.infer<typeof schema>;

// ============================================================
// Props
// ============================================================
interface TenantFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant | null; // null/undefined = add mode
}

// ============================================================
// Component
// ============================================================
export function TenantFormSheet({ open, onOpenChange, tenant }: TenantFormSheetProps) {
  const isEditing = !!tenant;
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const [dragOver, setDragOver] = useState(false);
  const [existingDocs, setExistingDocs] = useState(tenant?.documents ?? []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      move_in_date: '',
      currently_living: true,
      move_out_date: null,
      phone: '',
      email: '',
      new_documents: [],
      removed_document_ids: [],
    },
  });

  const currentlyLiving = form.watch('currently_living');
  const newDocs = form.watch('new_documents');

  // Sync values when editing
  useEffect(() => {
    if (open && tenant) {
      setExistingDocs(tenant.documents ?? []);
      form.reset({
        name: tenant.name,
        move_in_date: tenant.move_in_date,
        currently_living: !tenant.move_out_date,
        move_out_date: tenant.move_out_date,
        phone: tenant.phone ?? '',
        email: tenant.email ?? '',
        new_documents: [],
        removed_document_ids: [],
      });
    } else if (open && !tenant) {
      setExistingDocs([]);
      form.reset({
        name: '',
        move_in_date: '',
        currently_living: true,
        move_out_date: null,
        phone: '',
        email: '',
        new_documents: [],
        removed_document_ids: [],
      });
    }
  }, [open, tenant, form]);

  async function onSubmit(values: FormValues) {
    try {
      const payload = {
        name: values.name,
        move_in_date: values.move_in_date,
        currently_living: values.currently_living,
        move_out_date: values.move_out_date ?? null,
        phone: values.phone ?? '',
        email: values.email ?? '',
        new_documents: values.new_documents,
        removed_document_ids: values.removed_document_ids,
      };

      if (isEditing && tenant) {
        await updateTenant.mutateAsync({ id: tenant.id, values: payload });
        toast.success('Tenant updated successfully');
      } else {
        await createTenant.mutateAsync(payload);
        toast.success('Tenant added successfully');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
      console.error(err);
    }
  }

  function handleFileChange(files: FileList | File[] | null) {
    if (!files) return;
    const current = form.getValues('new_documents');
    form.setValue('new_documents', [...current, ...Array.from(files)]);
  }

  function removeNewDoc(index: number) {
    const current = form.getValues('new_documents');
    form.setValue(
      'new_documents',
      current.filter((_, i) => i !== index),
    );
  }

  function removeExistingDoc(docId: string) {
    setExistingDocs((prev) => prev.filter((d) => d.id !== docId));
    const current = form.getValues('removed_document_ids');
    form.setValue('removed_document_ids', [...current, docId]);
  }

  const isPending = createTenant.isPending || updateTenant.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg! p-0 gap-0 flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle>{isEditing ? 'Edit Tenant' : 'Add Tenant'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Update the tenant details below.'
              : 'Fill in the details to add a new tenant to the household.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Jane Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Move-in date */}
              <FormField
                control={form.control}
                name="move_in_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Move-In Date <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Currently living toggle */}
              <FormField
                control={form.control}
                name="currently_living"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Currently Living Here</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Toggle off to set a move-out date
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(val) => {
                          field.onChange(val);
                          if (val) form.setValue('move_out_date', null);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Move-out date — shown only if not currently living */}
              {!currentlyLiving && (
                <FormField
                  control={form.control}
                  name="move_out_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Move-Out Date <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input type="date" value={field.value || ''} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Divider */}
              <div className="border-t border-border pt-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                  Contact Details (Optional)
                </p>

                {/* Phone */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+61 400 000 000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="jane@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Documents */}
              <div className="border-t border-border pt-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                  Documents (Optional)
                </p>

                {/* Drop zone */}
                <div
                  className={cn(
                    'border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors',
                    dragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/30',
                  )}
                  onClick={() => document.getElementById('doc-file-input')?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFileChange(e.dataTransfer.files);
                  }}
                >
                  <Upload className="mx-auto size-7 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Any file type accepted</p>
                  <input
                    id="doc-file-input"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                </div>

                {/* Existing documents (edit mode) */}
                {existingDocs.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {existingDocs.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-muted/40 group"
                      >
                        <Paperclip className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="flex-1 truncate">{doc.name}</span>
                        <button
                          type="button"
                          onClick={() => removeExistingDoc(doc.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {/* New documents */}
                {newDocs.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {newDocs.map((file, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 group"
                      >
                        <Paperclip className="size-3.5 text-primary shrink-0" />
                        <span className="flex-1 truncate text-foreground">{file.name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          type="button"
                          onClick={() => removeNewDoc(idx)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Footer */}
            <SheetFooter className="px-6 py-4 border-t border-border gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Add Tenant'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
