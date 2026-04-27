import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/use-categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DynamicIcon, availableIcons } from '@/components/ui/dynamic-icon';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/components/layouts/layout-1/components/toolbar';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  icon: z.string().optional(),
  color: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export function SettingsPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const [addOpen, setAddOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
  });

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      await createCategory.mutateAsync({
        name: data.name,
        icon: data.icon || 'FileText',
        color: data.color || 'bg-slate-500',
      });
      setAddOpen(false);
      reset();
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  return (
    <>
      <Helmet>
        <title>Settings — Roofly</title>
      </Helmet>

      <div className="container space-y-6 pb-10">
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle>Settings</ToolbarPageTitle>
          </ToolbarHeading>
        </Toolbar>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-2">
            <h3 className="text-lg font-medium text-foreground">Bill Categories</h3>
            <p className="text-sm text-muted-foreground">
              Manage the categories available when adding utility bills or other property expenses.
            </p>
          </div>

          <div className="md:col-span-2">
            <div className="bg-card border border-border rounded-xl">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h4 className="font-medium text-foreground">Categories</h4>
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="size-4 mr-1" /> Add Category
                </Button>
              </div>

              <div className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
                ) : !categories || categories.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No categories found. Create one to get started.
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {categories.map((cat) => (
                      <li key={cat.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className={`size-8 flex items-center justify-center rounded-lg ${cat.color || 'bg-slate-500'}`}>
                            <DynamicIcon name={cat.icon} className="size-4 text-white" />
                          </div>
                          <span className="font-medium text-foreground">{cat.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          mode="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this category?')) {
                              deleteCategory.mutate(cat.id);
                            }
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={(open) => !open && setAddOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bill Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category Name</label>
                <Input {...register('name')} placeholder="e.g. HOA Fees" />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Icon</label>
                <select
                  {...register('icon')}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select an icon...</option>
                  {availableIcons.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
                {errors.icon && <p className="text-xs text-destructive">{errors.icon.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Colour Class (Tailwind)</label>
                <Input {...register('color')} placeholder="e.g. bg-rose-500" />
                <p className="text-xs text-muted-foreground">Optional tailwind bg color class.</p>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCategory.isPending}>
                {createCategory.isPending ? 'Saving...' : 'Save Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
