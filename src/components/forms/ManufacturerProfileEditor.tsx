'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Circle, Factory, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import ManufacturerCapabilitiesStep from '@/components/onboarding/ManufacturerCapabilitiesStep';
import { ShopCard } from '@/components/manufacturing/ShopCard';
import {
  saveManufacturerCompanyInfo,
  saveManufacturerProfile,
  saveManufacturerShopDetails,
} from '@/domain/manufacturing/profile';
import type {
  ManufacturerCapabilitiesData,
  ManufacturerCompanyInfo,
  ManufacturerShopDetails,
  ShopCardData,
} from '@/domain/manufacturing/profile';
import { US_STATES } from '@/lib/constants';
import { CompanyType } from '@/types/enums';
import { cn } from '@/lib/utils';

interface ManufacturerProfileEditorProps {
  initialData: ManufacturerCapabilitiesData & { shop: ManufacturerShopDetails };
  initialCompany: ManufacturerCompanyInfo;
}

type TabKey = 'capabilities' | 'details' | 'company';
type SectionKey = 'caps' | 'shop' | 'company';

interface ShopFormState {
  description: string;
  website: string;
  location: string;
  leadTime: string;
  minOrder: string;
}

const DESCRIPTION_LIMIT = 600;

const toShopForm = (shop: ManufacturerShopDetails): ShopFormState => ({
  description: shop.description,
  website: shop.website,
  location: shop.location,
  leadTime: shop.typicalLeadTimeWeeks?.toString() ?? '',
  minOrder: shop.minOrderQuantity?.toString() ?? '',
});

function parseOptionalInt(
  value: string,
  label: string
): { ok: true; value: number | null } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true, value: null };
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) {
    return { ok: false, error: `${label} must be a whole number` };
  }
  return { ok: true, value: parsed };
}

const withScheme = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

function DirtyDot() {
  return (
    <span
      className="ml-1.5 h-1.5 w-1.5 rounded-full bg-brand"
      aria-label="Unsaved changes"
    />
  );
}

function SaveBar({
  dirty,
  saving,
  label,
  error,
  onSave,
}: {
  dirty: boolean;
  saving: boolean;
  label: string;
  error: string | null;
  onSave: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 mt-6 space-y-2 border-t border-border bg-background/95 px-1 py-3 backdrop-blur">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3">
        <Button
          className="w-full rounded-full bg-[#e87722] text-white hover:bg-[#d06a1e] sm:w-auto sm:px-8"
          onClick={onSave}
          disabled={saving || !dirty}
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? 'Saving…' : label}
        </Button>
        <span className="text-xs text-muted-foreground">
          {dirty ? 'You have unsaved changes' : 'All changes saved'}
        </span>
      </div>
    </div>
  );
}

export default function ManufacturerProfileEditor({
  initialData,
  initialCompany,
}: ManufacturerProfileEditorProps) {
  const initialCaps: ManufacturerCapabilitiesData = {
    processes: initialData.processes,
    materialCategories: initialData.materialCategories,
    certifications: initialData.certifications,
  };

  const [tab, setTab] = useState<TabKey>('capabilities');
  const [saving, setSaving] = useState<SectionKey | null>(null);
  const [errors, setErrors] = useState<Record<SectionKey, string | null>>({
    caps: null,
    shop: null,
    company: null,
  });

  const [caps, setCaps] = useState(initialCaps);
  const [savedCaps, setSavedCaps] = useState(initialCaps);
  const [shop, setShop] = useState(() => toShopForm(initialData.shop));
  const [savedShop, setSavedShop] = useState(() => toShopForm(initialData.shop));
  const [company, setCompany] = useState(initialCompany);
  const [savedCompany, setSavedCompany] = useState(initialCompany);

  const capsDirty = JSON.stringify(caps) !== JSON.stringify(savedCaps);
  const shopDirty = JSON.stringify(shop) !== JSON.stringify(savedShop);
  const companyDirty = JSON.stringify(company) !== JSON.stringify(savedCompany);

  const setSectionError = (section: SectionKey, message: string | null) =>
    setErrors((prev) => ({ ...prev, [section]: message }));

  // Strength is based on what is saved, i.e. what matching and creators actually see.
  const checklist = [
    {
      label: 'Manufacturing processes',
      done: savedCaps.processes.length > 0,
      required: true,
      tab: 'capabilities' as TabKey,
    },
    {
      label: 'Material categories',
      done: savedCaps.materialCategories.length > 0,
      required: true,
      tab: 'capabilities' as TabKey,
    },
    {
      label: 'Shop description',
      done: savedShop.description.trim().length > 0,
      required: false,
      tab: 'details' as TabKey,
    },
    {
      label: 'Location',
      done: savedShop.location.trim().length > 0,
      required: false,
      tab: 'details' as TabKey,
    },
    {
      label: 'Typical lead time',
      done: savedShop.leadTime.trim().length > 0,
      required: false,
      tab: 'details' as TabKey,
    },
    {
      label: 'Quality certifications',
      done: savedCaps.certifications.length > 0,
      required: false,
      tab: 'capabilities' as TabKey,
    },
  ];
  const doneCount = checklist.filter((item) => item.done).length;
  const strength = Math.round((doneCount / checklist.length) * 100);
  const matchingReady = checklist
    .filter((item) => item.required)
    .every((item) => item.done);

  const previewData = useMemo<ShopCardData>(() => {
    const lead = parseOptionalInt(shop.leadTime, 'Lead time');
    const moq = parseOptionalInt(shop.minOrder, 'Minimum order');
    return {
      ...caps,
      description: shop.description.trim(),
      website: withScheme(shop.website),
      location: shop.location.trim(),
      typicalLeadTimeWeeks: lead.ok ? lead.value : null,
      minOrderQuantity: moq.ok ? moq.value : null,
    };
  }, [caps, shop]);

  const handleSaveCaps = async () => {
    setSaving('caps');
    setSectionError('caps', null);
    try {
      await saveManufacturerProfile(caps);
      setSavedCaps(caps);
      toast.success('Capabilities saved');
    } catch (error) {
      const message = errorMessage(error, 'Failed to save capabilities');
      setSectionError('caps', message);
      toast.error(message);
    } finally {
      setSaving(null);
    }
  };

  const handleSaveShop = async () => {
    const lead = parseOptionalInt(shop.leadTime, 'Lead time');
    const moq = parseOptionalInt(shop.minOrder, 'Minimum order');
    if (!lead.ok || !moq.ok) {
      setSectionError('shop', !lead.ok ? lead.error : !moq.ok ? moq.error : null);
      return;
    }

    setSaving('shop');
    setSectionError('shop', null);
    try {
      const saved = await saveManufacturerShopDetails({
        description: shop.description,
        website: shop.website,
        location: shop.location,
        typicalLeadTimeWeeks: lead.value,
        minOrderQuantity: moq.value,
      });
      const next = toShopForm({
        description: saved.description,
        website: saved.website,
        location: saved.location,
        typicalLeadTimeWeeks: saved.typicalLeadTimeWeeks,
        minOrderQuantity: saved.minOrderQuantity,
      });
      setShop(next);
      setSavedShop(next);
      toast.success('Shop details saved');
    } catch (error) {
      const message = errorMessage(error, 'Failed to save shop details');
      setSectionError('shop', message);
      toast.error(message);
    } finally {
      setSaving(null);
    }
  };

  const handleSaveCompany = async () => {
    setSaving('company');
    setSectionError('company', null);
    try {
      await saveManufacturerCompanyInfo(company);
      setSavedCompany(company);
      toast.success('Company details saved');
    } catch (error) {
      const message = errorMessage(error, 'Failed to save company details');
      setSectionError('company', message);
      toast.error(message);
    } finally {
      setSaving(null);
    }
  };

  const updateAddress = (
    field: keyof ManufacturerCompanyInfo['companyAddress'],
    value: string
  ) =>
    setCompany((prev) => ({
      ...prev,
      companyAddress: { ...prev.companyAddress, [field]: value },
    }));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        <div className="rounded-xl border border-border/70 bg-card/95 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Factory className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Profile strength</h3>
                <p className="text-sm text-muted-foreground">
                  {matchingReady
                    ? 'You are set up for order matching. A fuller profile helps creators choose your offers.'
                    : 'Add your processes and materials to appear in order matching.'}
                </p>
              </div>
            </div>
            <Badge variant={matchingReady ? 'secondary' : 'outline'}>
              {strength}% complete
            </Badge>
          </div>

          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${strength}%` }}
            />
          </div>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {checklist.map((item) => (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => setTab(item.tab)}
                  className="flex w-full items-center gap-2 rounded-md px-1 py-0.5 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0" />
                  )}
                  <span className={cn(item.done && 'text-foreground')}>
                    {item.label}
                  </span>
                  {item.required ? (
                    <span className="text-xs text-red-500">required</span>
                  ) : (
                    <span className="text-xs">(recommended)</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
          <TabsList className="h-auto w-full justify-start overflow-x-auto">
            <TabsTrigger value="capabilities">
              Capabilities {capsDirty && <DirtyDot />}
            </TabsTrigger>
            <TabsTrigger value="details">
              Shop details {shopDirty && <DirtyDot />}
            </TabsTrigger>
            <TabsTrigger value="company">
              Company {companyDirty && <DirtyDot />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="capabilities" className="mt-4">
            <ManufacturerCapabilitiesStep
              processes={caps.processes}
              materialCategories={caps.materialCategories}
              certifications={caps.certifications}
              onProcessesChange={(processes) =>
                setCaps((prev) => ({ ...prev, processes }))
              }
              onMaterialCategoriesChange={(materialCategories) =>
                setCaps((prev) => ({ ...prev, materialCategories }))
              }
              onCertificationsChange={(certifications) =>
                setCaps((prev) => ({ ...prev, certifications }))
              }
              errors={
                errors.caps
                  ? {
                      processes:
                        caps.processes.length === 0 ? errors.caps : undefined,
                      materialCategories:
                        caps.materialCategories.length === 0
                          ? errors.caps
                          : undefined,
                    }
                  : undefined
              }
            />
            <SaveBar
              dirty={capsDirty}
              saving={saving === 'caps'}
              label="Save capabilities"
              error={errors.caps}
              onSave={() => void handleSaveCaps()}
            />
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <div className="space-y-5 rounded-lg border p-4">
              <div>
                <h3 className="text-base font-medium">About your shop</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Creators see this next to your offers. Keep it short and
                  specific.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shop-description">Description</Label>
                <Textarea
                  id="shop-description"
                  rows={5}
                  maxLength={DESCRIPTION_LIMIT}
                  placeholder="e.g. Family-owned 5-axis CNC shop specialising in aluminium and titanium aerospace brackets. ISO 9001 certified."
                  value={shop.description}
                  onChange={(event) =>
                    setShop((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                />
                <p className="text-right text-xs text-muted-foreground">
                  {shop.description.length}/{DESCRIPTION_LIMIT}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shop-location">Location</Label>
                  <Input
                    id="shop-location"
                    placeholder="e.g. Auburn, AL"
                    maxLength={120}
                    value={shop.location}
                    onChange={(event) =>
                      setShop((prev) => ({
                        ...prev,
                        location: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-website">Website</Label>
                  <Input
                    id="shop-website"
                    placeholder="example.com"
                    maxLength={200}
                    value={shop.website}
                    onChange={(event) =>
                      setShop((prev) => ({
                        ...prev,
                        website: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-lead-time">
                    Typical lead time (weeks)
                  </Label>
                  <Input
                    id="shop-lead-time"
                    type="number"
                    min={0}
                    max={520}
                    placeholder="e.g. 4"
                    value={shop.leadTime}
                    onChange={(event) =>
                      setShop((prev) => ({
                        ...prev,
                        leadTime: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-moq">Minimum order quantity</Label>
                  <Input
                    id="shop-moq"
                    type="number"
                    min={1}
                    placeholder="e.g. 10"
                    value={shop.minOrder}
                    onChange={(event) =>
                      setShop((prev) => ({
                        ...prev,
                        minOrder: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <SaveBar
              dirty={shopDirty}
              saving={saving === 'shop'}
              label="Save shop details"
              error={errors.shop}
              onSave={() => void handleSaveShop()}
            />
          </TabsContent>

          <TabsContent value="company" className="mt-4">
            <div className="space-y-5 rounded-lg border p-4">
              <div>
                <h3 className="text-base font-medium">Company information</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Collected during onboarding. Name changes apply to new
                  offers; existing offers and orders keep the name they were
                  created with.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company name</Label>
                  <Input
                    id="company-name"
                    maxLength={120}
                    value={company.companyName}
                    onChange={(event) =>
                      setCompany((prev) => ({
                        ...prev,
                        companyName: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company type</Label>
                  <Select
                    value={company.companyType}
                    onValueChange={(value) =>
                      setCompany((prev) => ({ ...prev, companyType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(CompanyType).map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>State of formation</Label>
                  <Select
                    value={company.stateOfFormation}
                    onValueChange={(value) =>
                      setCompany((prev) => ({
                        ...prev,
                        stateOfFormation: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state.value} value={state.label}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-role">Your role in the company</Label>
                  <Input
                    id="company-role"
                    maxLength={80}
                    placeholder="e.g. Owner, Operations Manager"
                    value={company.representativeRole}
                    onChange={(event) =>
                      setCompany((prev) => ({
                        ...prev,
                        representativeRole: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-medium">Company address</h4>
                <div className="space-y-2">
                  <Label htmlFor="addr-street1">Street address</Label>
                  <Input
                    id="addr-street1"
                    value={company.companyAddress.street1}
                    onChange={(event) =>
                      updateAddress('street1', event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addr-street2">
                    Street address 2 (optional)
                  </Label>
                  <Input
                    id="addr-street2"
                    value={company.companyAddress.street2}
                    onChange={(event) =>
                      updateAddress('street2', event.target.value)
                    }
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="addr-city">City</Label>
                    <Input
                      id="addr-city"
                      value={company.companyAddress.city}
                      onChange={(event) =>
                        updateAddress('city', event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select
                      value={company.companyAddress.state}
                      onValueChange={(value) => updateAddress('state', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.label}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr-postal">Postal code</Label>
                    <Input
                      id="addr-postal"
                      value={company.companyAddress.postal_code}
                      onChange={(event) =>
                        updateAddress('postal_code', event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="addr-country">Country</Label>
                    <Input
                      id="addr-country"
                      value={company.companyAddress.country}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
            <SaveBar
              dirty={companyDirty}
              saving={saving === 'company'}
              label="Save company details"
              error={errors.company}
              onSave={() => void handleSaveCompany()}
            />
          </TabsContent>
        </Tabs>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            How creators see your shop
          </h3>
          <p className="text-xs text-muted-foreground">
            Shown beside your offers. Live preview, including unsaved edits.
          </p>
        </div>
        <ShopCard
          name={company.companyName}
          data={previewData}
          showEmptyHints
        />
      </aside>
    </div>
  );
}

