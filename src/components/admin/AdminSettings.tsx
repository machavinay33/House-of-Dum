import { useEffect, useState, type FormEvent } from 'react';
import type { RestaurantSettings } from '@/types';
import { toMessage } from '@/lib/errors';
import { saveSettings } from '@/services/settings';
import { removeImageByUrl } from '@/services/storage';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { TextArea, TextField } from '@/components/ui/Field';
import { ImageUploader } from '@/components/admin/controls';

export function AdminSettings() {
  const { settings, setSettings } = useSettings();
  const toast = useToast();
  const [form, setForm] = useState<RestaurantSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();

  // If settings finish loading after this tab opened, adopt them once.
  useEffect(() => {
    setForm(settings);
  }, [settings.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof RestaurantSettings>(key: K, value: RestaurantSettings[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setNameError('Restaurant name is required.');
      return;
    }
    setNameError(undefined);
    setSaving(true);
    try {
      const saved = await saveSettings(form);
      // Clean up replaced images.
      if (settings.logo_url && settings.logo_url !== saved.logo_url) await removeImageByUrl(settings.logo_url);
      if (settings.hero_image_url && settings.hero_image_url !== saved.hero_image_url) await removeImageByUrl(settings.hero_image_url);
      setSettings(saved);
      setForm(saved);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(toMessage(err, 'Could not save settings.', true));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-3xl">Restaurant settings</h2>
        <p className="text-sm text-mute">These details appear across the website: header, footer, About page and contact buttons.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <ImageUploader label="Logo" folder="branding" round value={form.logo_url} onChange={(url) => set('logo_url', url)} hint="Leave empty to use the default House of Dum logo." />
        <ImageUploader label="Home page background photo" folder="branding" value={form.hero_image_url} onChange={(url) => set('hero_image_url', url)} hint="Optional. A dark, atmospheric photo works best." />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="s-name" label="Restaurant name" value={form.name} onChange={(e) => set('name', e.target.value)} error={nameError} maxLength={80} />
        <TextField id="s-tagline" label="Tagline" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} maxLength={120} />
        <TextField id="s-phone" label="Phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} hint="Shown on Call buttons." maxLength={30} />
        <TextField id="s-whatsapp" label="WhatsApp number" type="tel" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} hint="Include country code, e.g. 919876543210. Leave empty to hide." maxLength={30} />
        <TextField id="s-instagram" label="Instagram" value={form.instagram} onChange={(e) => set('instagram', e.target.value)} hint="Username or full link. Leave empty to hide." maxLength={120} />
        <TextField id="s-branches" label="Other branches" value={form.branches} onChange={(e) => set('branches', e.target.value)} hint="Separate with |  e.g. Laxmi Nagar | MIHAN" maxLength={200} />
        <div className="sm:col-span-2">
          <TextArea id="s-address" label="Address" rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} maxLength={300} />
        </div>
        <div className="sm:col-span-2">
          <TextArea id="s-hours" label="Opening hours" rows={3} value={form.opening_hours} onChange={(e) => set('opening_hours', e.target.value)} hint="One line per day or range, e.g. Mon-Sun: 11:00 AM - 11:00 PM. Leave empty to hide." maxLength={400} />
        </div>
        <div className="sm:col-span-2">
          <TextArea id="s-description" label="Restaurant description" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={600} />
        </div>
      </div>

      <div className="sticky bottom-3 z-10 flex justify-end">
        <Button type="submit" size="lg" loading={saving} className="shadow-deep">
          Save settings
        </Button>
      </div>
    </form>
  );
}
