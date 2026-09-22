import { useState, type FormEvent } from 'react';
import type { MenuCategory, MenuItem } from '@/types';
import { toMessage } from '@/lib/errors';
import { deleteCategory, reorder, saveCategory } from '@/services/admin';
import { useToast } from '@/hooks/useToast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextArea, TextField } from '@/components/ui/Field';
import { ArrowButtons, moveId } from '@/components/admin/controls';

interface Props {
  open: boolean;
  onClose: () => void;
  categories: MenuCategory[];
  items: MenuItem[];
  onChanged: () => void;
}

interface Draft {
  id?: string;
  name: string;
  description: string;
  sort_order: number;
}

export function AdminCategories({ open, onClose, categories, items, onChanged }: Props) {
  const toast = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const countFor = (id: string) => items.filter((i) => i.category_id === id).length;

  const startAdd = () => {
    setError(undefined);
    setDraft({ name: '', description: '', sort_order: categories.reduce((m, c) => Math.max(m, c.sort_order), 0) + 10 });
  };
  const startEdit = (c: MenuCategory) => {
    setError(undefined);
    setDraft({ id: c.id, name: c.name, description: c.description ?? '', sort_order: c.sort_order });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    if (!draft.name.trim()) {
      setError('Enter a category name.');
      return;
    }
    setBusy(true);
    try {
      await saveCategory(draft);
      toast.success(draft.id ? 'Category updated' : 'Category added');
      setDraft(null);
      onChanged();
    } catch (err) {
      setError(toMessage(err, 'Could not save the category.', true));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: MenuCategory) => {
    const n = countFor(c.id);
    const message =
      n > 0
        ? `Delete "${c.name}" and its ${n} item${n === 1 ? '' : 's'}? This cannot be undone. Past orders are not affected.`
        : `Delete the empty category "${c.name}"?`;
    if (!window.confirm(message)) return;
    setBusy(true);
    try {
      await deleteCategory(c.id, items.filter((i) => i.category_id === c.id).map((i) => i.image_url));
      toast.success('Category deleted');
      onChanged();
    } catch (err) {
      toast.error(toMessage(err, 'Could not delete the category.', true));
    } finally {
      setBusy(false);
    }
  };

  const move = async (id: string, delta: -1 | 1) => {
    setBusy(true);
    try {
      await reorder('menu_categories', moveId(categories.map((c) => c.id), id, delta));
      onChanged();
    } catch (err) {
      toast.error(toMessage(err, 'Could not change the order.', true));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={draft ? (draft.id ? 'Edit category' : 'Add category') : 'Categories'}>
      {draft ? (
        <form onSubmit={submit} noValidate className="space-y-5">
          <TextField id="c-name" label="Category name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} error={error} maxLength={120} autoFocus />
          <TextArea id="c-desc" label="Description" optional rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} maxLength={300} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
              Back
            </Button>
            <Button type="submit" loading={busy}>
              Save category
            </Button>
          </div>
        </form>
      ) : (
        <div>
          <ul className="divide-y divide-gold-500/10 rounded-2xl border border-gold-500/15">
            {categories.map((c, i) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1 basis-40">
                  <p className="text-cream">{c.name}</p>
                  <p className="text-xs text-mute">
                    {countFor(c.id)} item{countFor(c.id) === 1 ? '' : 's'}
                  </p>
                </div>
                <ArrowButtons label={c.name} onUp={() => void move(c.id, -1)} onDown={() => void move(c.id, 1)} disableUp={i === 0 || busy} disableDown={i === categories.length - 1 || busy} />
                <Button variant="outline" size="sm" onClick={() => startEdit(c)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" disabled={busy} onClick={() => void remove(c)}>
                  Delete
                </Button>
              </li>
            ))}
            {categories.length === 0 && <li className="px-4 py-6 text-center text-mute">No categories yet.</li>}
          </ul>
          <Button className="mt-5" onClick={startAdd}>
            Add category
          </Button>
        </div>
      )}
    </Modal>
  );
}
