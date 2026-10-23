import { useState, useRef, useEffect } from 'react';
import { OrganizerLayout } from '@/components/OrganizerLayout';
import { PortalLayout } from '@/components/PortalLayout';
import { SignInModal } from '@/components/SignInModal';
import { RoleChoiceModal } from '@/components/RoleChoiceModal';
import { Surface } from '@/components/Surface';
import { LocationPicker, type PickedLocation } from '@/components/LocationPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, Navigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCreateEvent, useUpdateEvent, useRequestOrganizer } from '@/hooks/useOrganizer';
import { useEvent } from '@/hooks/useEvents';
import { useMyCommunities } from '@/hooks/useCommunities';
import { useAppStore } from '@/store/appStore';
import { payoutsService } from '@/services/payouts.service';
import { EVENT_THEMES, THEME_IDS } from '@/lib/eventThemes';
import { EVENT_CATEGORIES } from '@/constants/categories';
import { getCountryOptions, getStateOptions, getCityOptions, type GeoOption } from '@/lib/geo';
import { apiUpload } from '@/services/api';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar, Check, MapPin, Upload, X, Plus, Trash2, Shuffle, Globe, Building2, Loader2, AlertTriangle, ChevronDown, Sparkles,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEZONES = [
  { value: 'UTC',                 label: 'UTC (Coordinated Universal Time)' },
  { value: 'Asia/Kolkata',        label: 'IST - India (+05:30)' },
  { value: 'Asia/Dubai',          label: 'GST - Dubai (+04:00)' },
  { value: 'Asia/Singapore',      label: 'SGT - Singapore (+08:00)' },
  { value: 'Asia/Tokyo',          label: 'JST - Tokyo (+09:00)' },
  { value: 'Asia/Shanghai',       label: 'CST - Shanghai (+08:00)' },
  { value: 'Europe/London',       label: 'GMT - London (+00:00)' },
  { value: 'Europe/Paris',        label: 'CET - Paris (+01:00)' },
  { value: 'America/New_York',    label: 'EST - New York (-05:00)' },
  { value: 'America/Chicago',     label: 'CST - Chicago (-06:00)' },
  { value: 'America/Los_Angeles', label: 'PST - Los Angeles (-08:00)' },
  { value: 'Australia/Sydney',    label: 'AEDT - Sydney (+11:00)' },
];

const DEFAULT_TICKET_TYPES: TicketType[] = [
  {
    id: 'premium',
    name: 'Premium',
    price: 5000,
    count: 10,
    benefits: ['VIP seating', 'Networking dinner', 'Speaker meet & greet', 'Swag bag'],
    color: 'gold',
    isEnabled: true,
  },
  {
    id: 'silver',
    name: 'Silver',
    price: 2000,
    count: 30,
    benefits: ['Reserved seating', 'Lunch included', 'Networking session'],
    color: 'silver',
    isEnabled: true,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 500,
    count: 60,
    benefits: ['General admission', 'Coffee breaks'],
    color: 'blue',
    isEnabled: true,
  },
];

const TICKET_COLORS: Record<string, string> = {
  gold:   'from-amber-500/20 to-yellow-500/20 border-amber-500/40',
  silver: 'from-slate-400/20 to-gray-300/20 border-slate-400/40',
  blue:   'from-blue-500/20 to-indigo-500/20 border-blue-500/40',
  green:  'from-emerald-500/20 to-teal-500/20 border-emerald-500/40',
  purple: 'from-purple-500/20 to-violet-500/20 border-purple-500/40',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface TicketType {
  id: string;
  name: string;
  price: number;
  count: number;
  benefits: string[];
  color: string;
  isEnabled: boolean;
}

interface FormState {
  title: string;
  description: string;
  category: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  timezone: string;
  locationType: 'IN_PERSON' | 'VIRTUAL' | 'HYBRID';
  address: string;
  city: string;
  /** ISO state code, e.g. "TG" — converted to the full state name on submit. */
  state: string;
  /** ISO country code, e.g. "IN" — converted to the full country name on submit. */
  country: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  placeId: string;
  meetingUrl: string;
  coverImage: string;
  theme: string;
  useTicketTypes: boolean;
  capacity: number;
  isPaid: boolean;
  ticketPrice: string;
  ticketTypes: TicketType[];
  requiresApproval: boolean;
  waitlistEnabled: boolean;
  visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
  tags: string;
  slug: string;
  communityId: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const BECOME_ORGANIZER_STEPS = [
  'Click "Become an organizer" below',
  'Optionally add your company or event brand name',
  "You're upgraded instantly — no approval or waiting period",
  'You land right back here, ready to create your first event',
];

const CreateEventPage = () => {
  const navigate = useNavigate();
  // Edit mode: this same form powers `/organizer/events/:id/edit`. When an id is
  // present we load the event, pre-fill the form once, and submit via updateEvent.
  const { id: editEventId } = useParams<{ id: string }>();
  const isEdit = !!editEventId;
  const { data: editEvent } = useEvent(editEventId ?? '');
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const requestOrgMutation = useRequestOrganizer();
  const { data: myCommunities } = useMyCommunities();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefilledRef = useRef(false);

  // Luma pattern: render the form for signed-out visitors too. The modal
  // overlays the page, so they can see what they're signing in for. Form
  // state persists across the auth round-trip because we don't unmount.
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const userRole = useAppStore((s) => s.user?.role);
  const [orgName, setOrgName] = useState('');

  // ─── Auth gate ───────────────────────────────────────────────────────────
  // All gate hooks live ABOVE the early returns below so hook order stays stable
  // regardless of auth/role state (Rules of Hooks).

  // Signed-out visitors first pick a path (organize vs attend), then sign in.
  const [gateStep, setGateStep] = useState<'choose' | 'organizer' | 'attendee' | null>(
    isAuthenticated ? null : 'choose'
  );
  useEffect(() => {
    setGateStep(isAuthenticated ? null : 'choose');
  }, [isAuthenticated]);

  // Organizer path: users who explicitly chose "Organize" carry a pending-upgrade
  // flag (set in SignInModal). The backend starts everyone as ATTENDEE, so we
  // auto-run the instant self-serve upgrade here instead of making them click the
  // manual "Become an organizer" card. Seeded from the flag at mount so the manual
  // card never flashes.
  const [autoUpgrading, setAutoUpgrading] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('fk-pending-organizer-upgrade') === '1'
  );
  useEffect(() => {
    if (!isAuthenticated) return;
    const pending = localStorage.getItem('fk-pending-organizer-upgrade') === '1';
    if (pending && userRole === 'attendee') {
      localStorage.removeItem('fk-pending-organizer-upgrade');
      setAutoUpgrading(true);
      requestOrgMutation.mutate('', { onError: () => setAutoUpgrading(false) });
    } else if (userRole && userRole !== 'attendee') {
      // Already elevated (or admin) — drop any stale flag.
      localStorage.removeItem('fk-pending-organizer-upgrade');
      setAutoUpgrading(false);
    }
    // requestOrgMutation is stable from react-query; excluded to avoid re-runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userRole]);

  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [locationExpanded, setLocationExpanded] = useState(false);
  // Open by default: description is required, so it shouldn't look optional.
  const [descExpanded, setDescExpanded] = useState(true);

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    category: '',
    startDate: '',
    startTime: '19:00',
    endDate: '',
    endTime: '20:00',
    timezone: 'Asia/Kolkata',
    locationType: 'IN_PERSON',
    address: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    latitude: null,
    longitude: null,
    placeId: '',
    meetingUrl: '',
    coverImage: '',
    theme: 'indigo',
    useTicketTypes: false,
    capacity: 100,
    isPaid: false,
    ticketPrice: '',
    ticketTypes: DEFAULT_TICKET_TYPES,
    requiresApproval: false,
    waitlistEnabled: true,
    visibility: 'PUBLIC',
    tags: '',
    slug: '',
    communityId: '',
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // ── Payout gate ─────────────────────────────────────────────────────────────
  // Warn organizers who are selling paid tickets but have no verified payout
  // account — otherwise their ticket revenue sits held until they onboard.
  const isPaidEvent =
    (!form.useTicketTypes && form.isPaid && Number(form.ticketPrice) > 0) ||
    (form.useTicketTypes && form.ticketTypes.some((t) => (t.isEnabled ?? true) && Number(t.price) > 0));
  const { data: payoutData } = useQuery({
    queryKey: ['organizer', 'payouts', 'account'],
    queryFn: () => payoutsService.getRouteAccount(),
    select: (r) => r.data,
    enabled: isAuthenticated && (userRole === 'organizer' || userRole === 'admin'),
    staleTime: 5 * 60_000,
  });
  const payoutReady = payoutData?.account?.razorpayAccountStatus === 'activated';

  // ── Location cascade: country → state → city ────────────────────────────────
  // The geo dataset (7.7 MB of cities) loads as a separate async chunk on first
  // use, so these resolve asynchronously rather than synchronously in render.
  const [countryOptions, setCountryOptions] = useState<GeoOption[]>([]);
  const [stateOptions, setStateOptions] = useState<GeoOption[]>([]);
  const [cityOptions, setCityOptions] = useState<GeoOption[]>([]);

  useEffect(() => {
    getCountryOptions().then(setCountryOptions);
  }, []);
  useEffect(() => {
    if (!form.country) return setStateOptions([]);
    let active = true;
    getStateOptions(form.country).then((o) => active && setStateOptions(o));
    return () => {
      active = false;
    };
  }, [form.country]);
  useEffect(() => {
    if (!form.country || !form.state) return setCityOptions([]);
    let active = true;
    getCityOptions(form.country, form.state).then((o) => active && setCityOptions(o));
    return () => {
      active = false;
    };
  }, [form.country, form.state]);

  // ── Edit mode: pre-fill the form from the loaded event (once) ────────────────
  // Country/state are stored as full names but the pickers key on ISO codes, so
  // we reverse-map name → code. The values round-trip exactly because they were
  // saved from this same geo dataset, so an exact name match always resolves.
  useEffect(() => {
    if (!isEdit || !editEvent || prefilledRef.current) return;
    prefilledRef.current = true;
    const ev = editEvent as typeof editEvent & { timezone?: string; communityId?: string };
    const sd = new Date(ev.startDate);
    const ed = new Date(ev.endDate);
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const timeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    const tiers = ev.ticketTypes ?? [];

    (async () => {
      let country = '';
      let state = '';
      if (ev.country) {
        const countries = await getCountryOptions();
        country = countries.find((c) => c.name === ev.country)?.code ?? '';
        if (country && ev.state) {
          const states = await getStateOptions(country);
          state = states.find((s) => s.name === ev.state)?.code ?? '';
        }
      }
      setForm((f) => ({
        ...f,
        title: ev.title ?? '',
        description: ev.description ?? '',
        category: ev.category ?? '',
        startDate: dateStr(sd),
        startTime: timeStr(sd),
        endDate: dateStr(ed),
        endTime: timeStr(ed),
        timezone: ev.timezone ?? f.timezone,
        locationType: ev.locationType,
        address: ev.address ?? '',
        city: ev.city ?? '',
        state,
        country,
        pincode: ev.pincode ?? '',
        latitude: ev.latitude ?? null,
        longitude: ev.longitude ?? null,
        placeId: ev.placeId ?? '',
        meetingUrl: ev.meetingUrl ?? '',
        coverImage: ev.coverImage ?? '',
        theme: ev.theme ?? f.theme,
        useTicketTypes: tiers.length > 0,
        capacity: ev.capacity ?? f.capacity,
        isPaid: !!ev.ticketPrice && Number(ev.ticketPrice) > 0,
        ticketPrice: ev.ticketPrice ? String(ev.ticketPrice) : '',
        ticketTypes: tiers.length > 0
          ? tiers.map((t) => ({
              id: t.id,
              name: t.name,
              price: t.price,
              count: t.count,
              benefits: t.benefits ?? [],
              color: (t as { color?: string }).color ?? 'blue',
              isEnabled: t.isEnabled ?? true,
            }))
          : f.ticketTypes,
        requiresApproval: ev.requiresApproval ?? false,
        waitlistEnabled: ev.waitlistEnabled ?? true,
        visibility: ev.visibility ?? 'PUBLIC',
        tags: (ev.tags ?? []).join(', '),
        slug: ev.slug ?? '',
        communityId: ev.communityId ?? '',
      }));
      if (ev.coverImage) setImagePreview(ev.coverImage);
    })();
  }, [isEdit, editEvent]);

  // ─── Role guards ───────────────────────────────────────────────────────────
  // Kept below all hooks so hook order stays stable across renders (Rules of Hooks).

  // Admins manage events via /admin — bounce them to their dashboard.
  if (isAuthenticated && userRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Published (or cancelled) events cannot be edited — redirect back to the
  // event overview so even a direct URL visit (/edit) is blocked.
  if (isEdit && editEvent && editEvent.status !== 'DRAFT') {
    return <Navigate to={`/organizer/events/${editEventId}`} replace />;
  }

  // Attendees can't create events — offer the instant self-serve upgrade instead
  // of silently bouncing them away. Once the mutation flips their role, this same
  // component re-renders past this guard and shows the real form, no navigation needed.
  if (isAuthenticated && userRole === 'attendee') {
    // Organizer path: instant self-serve upgrade is running — show a brief
    // loading state instead of the manual card.
    if (autoUpgrading) {
      return (
        <PortalLayout>
          <div className="max-w-md mx-auto py-8 md:py-12">
            <Surface className="text-center space-y-4 py-10">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <div>
                <h1 className="text-lg font-semibold text-foreground">Setting up your organizer account…</h1>
                <p className="mt-1 text-sm text-muted-foreground">This only takes a moment.</p>
              </div>
            </Surface>
          </div>
        </PortalLayout>
      );
    }
    return (
      <PortalLayout>
        <div className="max-w-md mx-auto py-8 md:py-12">
          <Surface className="text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Only organizers can create events</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Upgrade your account to start hosting — it's instant and free.
              </p>
            </div>

            <div className="text-left space-y-3 rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                How to become an organizer
              </p>
              {BECOME_ORGANIZER_STEPS.map((step, i) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {i + 1}
                  </span>
                  <p className="text-sm text-foreground">{step}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-left">
              <Label htmlFor="orgName">Organization name (optional)</Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Acme Events"
              />
            </div>

            <Button
              className="w-full"
              onClick={() =>
                requestOrgMutation.mutate(orgName, {
                  onSuccess: () => toast.success("You're an organizer now. Let's create your event!"),
                })
              }
              disabled={requestOrgMutation.isPending}
            >
              {requestOrgMutation.isPending ? 'Upgrading…' : 'Become an organizer'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
              Maybe later
            </Button>
          </Surface>
        </div>
      </PortalLayout>
    );
  }

  // ── Ticket allocation ─────────────────────────────────────────────────────

  const allocateTicketSeats = (totalCapacity: number, currentTypes: TicketType[]) => {
    const cap = Math.max(0, Math.floor(totalCapacity));
    const premiumCount = Math.floor(cap * 0.1);
    const silverCount = Math.floor(cap * 0.3);
    const basicCount = Math.max(0, cap - premiumCount - silverCount);

    const counts: Record<string, number> = {
      premium: premiumCount,
      silver: silverCount,
      basic: basicCount,
    };

    return currentTypes.map((t) => ({
      ...t,
      count: counts[t.id] ?? t.count,
    }));
  };

  const toISO = (date: string, time: string) =>
    date ? new Date(`${date}T${time}:00`).toISOString() : '';

  // ── Image upload ──────────────────────────────────────────────────────────

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    // Upload to backend
    setUploading(true);
    try {
      const res = await apiUpload<{ data: { url: string } }>('/media/upload', file);
      set('coverImage', res.data.url);
      toast.success('Image uploaded');
    } catch {
      // Keep local preview, store data URL as fallback
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        set('coverImage', dataUrl);
      };
      reader.readAsDataURL(file);
      toast.error('Upload failed, image will be embedded as data URL');
    } finally {
      setUploading(false);
    }
  };

  // ── Ticket type helpers ───────────────────────────────────────────────────

  const updateTicket = (id: string, patch: Partial<TicketType>) =>
    setForm((prev) => ({
      ...prev,
      ticketTypes: prev.ticketTypes.map((t) =>
        t.id === id ? { ...t, ...patch } : t
      ),
    }));

  const addBenefit = (id: string) =>
    updateTicket(id, { benefits: [...(form.ticketTypes.find((t) => t.id === id)?.benefits ?? []), ''] });

  const updateBenefit = (ticketId: string, idx: number, val: string) =>
    updateTicket(ticketId, {
      benefits: (form.ticketTypes.find((t) => t.id === ticketId)?.benefits ?? []).map((b, i) => i === idx ? val : b),
    });

  const removeBenefit = (ticketId: string, idx: number) =>
    updateTicket(ticketId, {
      benefits: (form.ticketTypes.find((t) => t.id === ticketId)?.benefits ?? []).filter((_, i) => i !== idx),
    });

  const handleTicketCountChange = (id: string, newCount: number) => {
    updateTicket(id, { count: Math.max(0, newCount) });
  };

  // Capacity tracking for multi-tier mode
  const usedCapacity = form.ticketTypes.filter((t) => t.isEnabled).reduce((s, t) => s + t.count, 0);
  const remainingCapacity = form.capacity - usedCapacity;

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    // Auth gate: if the visitor isn't signed in, prompt sign-in instead of
    // hitting the API. Their form state stays intact behind the modal, so
    // they can submit immediately after signing in.
    if (!isAuthenticated) {
      // Open the organizer sign-in gate (the create form is an organizer intent).
      // Their form state stays intact behind the modal.
      setGateStep('organizer');
      return;
    }

    if (!form.title || form.title.trim().length < 3) {
      toast.error('Event name must be at least 3 characters.');
      return;
    }

    // Backend requires a description (min 10 chars) — enforce it here too so the
    // user gets a clear message instead of a server-side validation error.
    if (!form.description || form.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters.');
      return;
    }

    if (!form.category) {
      toast.error('Please pick a category.');
      return;
    }

    if (!form.country || !form.state || !form.city || !form.address) {
      toast.error('Please complete the event location: country, state, city, and address.');
      return;
    }

    if (!form.pincode.trim()) {
      toast.error('Pincode is required.');
      return;
    }

    const startISO = toISO(form.startDate, form.startTime);
    const endISO   = toISO(form.endDate, form.endTime);

    if (!startISO) { toast.error('Please set a start date.'); return; }
    if (!endISO)   { toast.error('Please set an end date.'); return; }

    const startDt = new Date(startISO);
    const endDt   = new Date(endISO);

    // Only new events must start in the future — an event being edited may
    // already have started (or ended), and blocking that would make it uneditable.
    if (!isEdit && startDt <= new Date()) { toast.error('Start date must be in the future.'); return; }
    if (endDt <= startDt)     { toast.error('End date must be after the start date.'); return; }

    if (form.useTicketTypes && usedCapacity > form.capacity) {
      toast.error('Ticket tier seats exceed total capacity.');
      return;
    }

    if (!form.useTicketTypes && form.isPaid && !(Number(form.ticketPrice) > 0)) {
      toast.error('Please enter a ticket price.');
      return;
    }

    const meetingUrl = form.locationType !== 'IN_PERSON' ? (form.meetingUrl || undefined) : undefined;
    const activeTickets = form.useTicketTypes ? form.ticketTypes.filter((t) => t.isEnabled) : undefined;

    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      startDate: startISO,
      endDate: endISO,
      type: form.locationType,
      location: {
        address: form.address,
        city: form.city,
        state: stateOptions.find((s) => s.code === form.state)?.name ?? form.state,
        country: countryOptions.find((c) => c.code === form.country)?.name ?? form.country,
        pincode: form.pincode.trim(),
        meetingUrl,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        placeId: form.placeId || undefined,
      },
      coverImage: form.coverImage || undefined,
      theme: form.theme,
      timezone: form.timezone,
      capacity: form.capacity,
      ticketPrice: (!form.useTicketTypes && form.isPaid && form.ticketPrice) ? Number(form.ticketPrice) : undefined,
      ticketTypes: activeTickets,
      requiresApproval: form.requiresApproval,
      waitlistEnabled: form.waitlistEnabled,
      visibility: form.visibility,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      slug: form.slug || undefined,
      communityId: form.communityId || undefined,
    };

    try {
      if (isEdit && editEventId) {
        await updateMutation.mutateAsync({ id: editEventId, payload });
        navigate(`/organizer/events/${editEventId}`);
      } else {
        const res = await createMutation.mutateAsync(payload);
        navigate(`/organizer/events/${(res as { data: { id: string } }).data.id}`);
      }
    } catch {
      // Error is already shown by the mutation's onError toast
    }
  };

  // The button stays clickable; handleSubmit toasts the specific error for any
  // missing/invalid field (name, description, category, dates, ticket math) so
  // users always learn what to fix instead of facing a dead disabled button.

  // Inline hint under the submit button — surfaces what's still required so
  // users can see what's left before they even click.
  const missingHints: string[] = [];
  if (form.title.trim().length < 3) missingHints.push('Event name (3+ chars)');
  if (form.description.trim().length < 10) missingHints.push('Description (10+ chars)');
  if (!form.category) missingHints.push('Category');
  if (!form.startDate) missingHints.push('Start date');
  if (!form.endDate) missingHints.push('End date');

  // ── Theme randomizer ──────────────────────────────────────────────────────

  const randomizeTheme = () => {
    const idx = Math.floor(Math.random() * THEME_IDS.length);
    set('theme', THEME_IDS[idx]);
  };

  // ─────────────────────────────────────────────────────────────────────────

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';
  const activeTheme = EVENT_THEMES[form.theme] ?? EVENT_THEMES.indigo;

  return (
    <OrganizerLayout>
      <div
        className={`min-h-screen -m-4 md:-m-8 p-4 md:p-8 antialiased transition-colors duration-500 relative ${
          isDark ? 'text-[#ECECEC]' : 'text-neutral-900'
        }`}
        style={{
          background: isDark
            ? `radial-gradient(ellipse 80% 50% at 50% -10%, ${activeTheme.accent}26 0%, transparent 65%)`
            : undefined,
        }}
      >
        <div className="max-w-[960px] mx-auto pb-16 relative z-10">

          {isEdit && (
            <div className="mb-6">
              <h1 className={`text-2xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>Edit Event</h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Update the details below and save your changes.
              </p>
            </div>
          )}

          {/* ── Two-column grid ────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-[340px,1fr] gap-8 items-start">

            {/* ── LEFT: Cover picker + Theme (sticky on wide screens, so it stays in view) */}
            <div className="space-y-4 lg:sticky lg:top-6">

              {/* Cover image preview & picker — square container with rounded corners */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) void handleFileSelect(file);
                }}
                className={`group relative w-full aspect-square rounded-[14px] shadow-sm flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                  isDark
                    ? 'bg-[#2a2a2d]/80 border border-white/10 hover:border-white/20'
                    : 'bg-white border border-neutral-200/80 hover:border-neutral-300 shadow-md'
                }`}
                style={(!imagePreview && !form.coverImage) ? { background: activeTheme.bannerGradient } : undefined}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2.5">
                    <div className="w-8 h-8 border-2 border-white/90 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-medium text-white/80">Uploading image...</p>
                  </div>
                ) : (imagePreview || form.coverImage) ? (
                  <>
                    <img
                      src={imagePreview || form.coverImage}
                      alt="Cover preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); set('coverImage', ''); setImagePreview(''); }}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 hover:bg-black/85 text-white/80 hover:text-white flex items-center justify-center transition-colors z-10"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {/* Bottom-right change button overlay */}
                    <div className="absolute bottom-3 right-3 z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 hover:bg-black/90 backdrop-blur-md text-xs font-medium text-white border border-white/10 transition-all shadow-sm">
                        <Upload className="w-3.5 h-3.5" /> Change
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center text-white mb-2 group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-medium text-white drop-shadow-sm">Add Event Cover</p>
                    <p className="text-[11px] text-white/80 mt-0.5">JPG, PNG, WEBP · up to 5MB</p>
                    {/* Bottom-right corner trigger pill */}
                    <div className="absolute bottom-3 right-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm text-[11px] font-medium text-white/90 border border-white/10">
                        <Upload className="w-3 h-3" /> Upload
                      </span>
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFileSelect(f); }}
              />

              {/* Theme selector card */}
              <div
                className={`p-3.5 rounded-[14px] flex items-center justify-between gap-3 transition-colors ${
                  isDark
                    ? 'border border-white/10'
                    : 'border border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg border border-black/10 shrink-0 shadow-sm"
                    style={{ background: activeTheme.bannerGradient }}
                  />
                  <div className="min-w-0">
                    <span className={`text-[11px] uppercase tracking-wider block font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      Theme
                    </span>
                    <span className={`text-sm font-medium truncate block ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                      {activeTheme.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus:outline-none ${
                          isDark
                            ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200'
                            : 'bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 text-neutral-700'
                        }`}
                      >
                        <span>Change</span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className={`w-56 p-2 rounded-xl shadow-2xl z-50 backdrop-blur-xl ${
                        isDark
                          ? 'border border-white/15 bg-[#252528] text-neutral-100'
                          : 'border border-neutral-200 bg-white text-neutral-900'
                      }`}
                    >
                      <div className={`text-[11px] font-semibold px-2 py-1 uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        Available Themes
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 mt-1 max-h-60 overflow-y-auto">
                        {THEME_IDS.map((id) => {
                          const theme = EVENT_THEMES[id];
                          const isActive = form.theme === id;
                          return (
                            <DropdownMenuItem
                              key={id}
                              onClick={() => set('theme', id)}
                              className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                                isActive
                                  ? (isDark ? 'bg-white/15 text-white font-medium' : 'bg-neutral-100 text-neutral-950 font-semibold')
                                  : (isDark ? 'text-neutral-300 hover:bg-white/5' : 'text-neutral-700 hover:bg-neutral-100')
                              }`}
                            >
                              <div
                                className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                                style={{ background: theme.bannerGradient }}
                              />
                              <span className="text-xs truncate">{theme.label}</span>
                              {isActive && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                            </DropdownMenuItem>
                          );
                        })}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <button
                    type="button"
                    onClick={randomizeTheme}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isDark
                        ? 'bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 text-neutral-700 hover:text-neutral-900'
                    }`}
                    title="Randomize Theme"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

            {/* ── RIGHT: Event Details ─────────────────────────────────────── */}
            <div className="space-y-4">

              {/* Event Name Card */}
              <div
                className={`p-4 rounded-[14px] transition-colors ${
                  isDark
                    ? 'border border-white/10'
                    : 'border border-neutral-200'
                }`}
              >
                <label htmlFor="event-title" className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="event-title"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Enter event name..."
                  className={`w-full bg-transparent text-xl font-semibold placeholder:opacity-50 focus:outline-none border-b border-transparent focus:border-primary/40 pb-1 transition-colors ${
                    isDark ? 'text-white placeholder:text-neutral-500' : 'text-neutral-900 placeholder:text-neutral-400'
                  }`}
                />
              </div>

              {/* ── When ── */}
              <p className={`pt-2 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                When
              </p>

              {/* Date & Time Card */}
              <div
                className={`p-4 rounded-[14px] space-y-3.5 transition-colors ${
                  isDark
                    ? 'border border-white/10'
                    : 'border border-neutral-200'
                }`}
              >
                {/* Start */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                  <div className="flex-1">
                    <span className={`text-[11px] block mb-1 font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      Start Date <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => set('startDate', e.target.value)}
                      className={`w-full h-9 px-3 rounded-lg text-sm focus:outline-none focus:border-primary/50 ${
                        isDark
                          ? 'bg-black/20 border border-white/10 text-neutral-100'
                          : 'bg-neutral-50 border border-neutral-200 text-neutral-900'
                      }`}
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <span className={`text-[11px] block mb-1 font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      Start Time <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => set('startTime', e.target.value)}
                      className={`w-full h-9 px-3 rounded-lg text-sm focus:outline-none focus:border-primary/50 ${
                        isDark
                          ? 'bg-black/20 border border-white/10 text-neutral-100'
                          : 'bg-neutral-50 border border-neutral-200 text-neutral-900'
                      }`}
                    />
                  </div>
                </div>

                {/* End */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                  <div className="flex-1">
                    <span className={`text-[11px] block mb-1 font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      End Date <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => set('endDate', e.target.value)}
                      className={`w-full h-9 px-3 rounded-lg text-sm focus:outline-none focus:border-primary/50 ${
                        isDark
                          ? 'bg-black/20 border border-white/10 text-neutral-100'
                          : 'bg-neutral-50 border border-neutral-200 text-neutral-900'
                      }`}
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <span className={`text-[11px] block mb-1 font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      End Time <span className="text-red-500">*</span>
                    </span>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => set('endTime', e.target.value)}
                      className={`w-full h-9 px-3 rounded-lg text-sm focus:outline-none focus:border-primary/50 ${
                        isDark
                          ? 'bg-black/20 border border-white/10 text-neutral-100'
                          : 'bg-neutral-50 border border-neutral-200 text-neutral-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Timezone */}
                <div className="pt-1 flex items-center gap-2.5">
                  <Globe className={`w-4 h-4 shrink-0 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
                  <select
                    value={form.timezone}
                    onChange={(e) => set('timezone', e.target.value)}
                    className={`flex-1 h-9 px-2.5 text-xs rounded-lg focus:outline-none focus:border-primary/50 ${
                      isDark
                        ? 'bg-black/20 border border-white/10 text-neutral-200'
                        : 'bg-neutral-50 border border-neutral-200 text-neutral-800'
                    }`}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value} className={isDark ? 'bg-[#252528] text-white' : 'bg-white text-neutral-900'}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── Where ── */}
              <p className={`pt-2 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Where
              </p>

              {/* Location — expandable card */}
              <div
                className={`p-4 rounded-[14px] transition-colors ${
                  isDark
                    ? 'border border-white/10'
                    : 'border border-neutral-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setLocationExpanded((v) => !v)}
                  className={`w-full flex items-center gap-2.5 text-sm text-left font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}
                >
                  <MapPin className={`w-4 h-4 shrink-0 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
                  <span className={form.address ? (isDark ? 'text-white' : 'text-neutral-900 font-medium') : (isDark ? 'text-neutral-400' : 'text-neutral-500')}>
                    {form.address ? form.address : 'Add Event Location - In Person'}
                  </span>
                  <span className={`ml-auto text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{locationExpanded ? '▲' : '▼'}</span>
                </button>

                {locationExpanded && (
                  <div className={`mt-4 pt-3 space-y-3 ${isDark ? 'border-t border-white/10' : 'border-t border-neutral-150'}`}>
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs ${
                        isDark ? 'bg-white/5 border border-white/10 text-neutral-300' : 'bg-neutral-100 border border-neutral-200 text-neutral-700'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 opacity-70" />
                      <span>In Person</span>
                    </div>

                    {/* Google Places search */}
                    <LocationPicker
                      latitude={form.latitude}
                      longitude={form.longitude}
                      placeId={form.placeId}
                      onPick={(loc: PickedLocation) =>
                        setForm((prev) => ({
                          ...prev,
                          address: loc.address || prev.address,
                          city: loc.city || prev.city,
                          state: loc.state || prev.state,
                          country: loc.country || prev.country,
                          pincode: loc.pincode || prev.pincode,
                          latitude: loc.latitude,
                          longitude: loc.longitude,
                          placeId: loc.placeId,
                        }))
                      }
                    />

                    {form.placeId ? (
                      <div className={`p-3 rounded-lg text-xs space-y-1 ${isDark ? 'bg-black/20 border border-white/10' : 'bg-neutral-50 border border-neutral-200'}`}>
                        <div className={isDark ? 'text-neutral-300' : 'text-neutral-700'}>
                          {[form.city, form.state, form.country].filter(Boolean).join(', ') || 'Location selected'}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              latitude: null,
                              longitude: null,
                              placeId: '',
                              country: '',
                              state: '',
                              city: '',
                            }))
                          }
                          className="text-primary hover:underline text-[11px]"
                        >
                          Change / enter manually
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Or enter it manually:</p>

                        <select
                          value={form.country}
                          onChange={(e) => {
                            const country = e.target.value;
                            setForm((prev) => ({ ...prev, country, state: '', city: '' }));
                          }}
                          className={`w-full h-9 px-2.5 text-xs rounded-lg focus:outline-none focus:border-primary/50 ${
                            isDark
                              ? 'bg-black/20 border border-white/10 text-neutral-200'
                              : 'bg-neutral-50 border border-neutral-200 text-neutral-800'
                          }`}
                        >
                          <option value="" className={isDark ? 'bg-[#252528]' : 'bg-white'}>Select country…</option>
                          {countryOptions.map((c) => (
                            <option key={c.code} value={c.code} className={isDark ? 'bg-[#252528]' : 'bg-white'}>{c.name}</option>
                          ))}
                        </select>

                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={form.state}
                            onChange={(e) => {
                              const state = e.target.value;
                              setForm((prev) => ({ ...prev, state, city: '' }));
                            }}
                            disabled={!form.country}
                            className={`h-9 px-2.5 text-xs rounded-lg focus:outline-none focus:border-primary/50 disabled:opacity-40 ${
                              isDark
                                ? 'bg-black/20 border border-white/10 text-neutral-200'
                                : 'bg-neutral-50 border border-neutral-200 text-neutral-800'
                            }`}
                          >
                            <option value="" className={isDark ? 'bg-[#252528]' : 'bg-white'}>Select state…</option>
                            {stateOptions.map((s) => (
                              <option key={s.code} value={s.code} className={isDark ? 'bg-[#252528]' : 'bg-white'}>{s.name}</option>
                            ))}
                          </select>

                          {cityOptions.length > 0 ? (
                            <select
                              value={form.city}
                              onChange={(e) => set('city', e.target.value)}
                              disabled={!form.state}
                              className={`h-9 px-2.5 text-xs rounded-lg focus:outline-none focus:border-primary/50 disabled:opacity-40 ${
                                isDark
                                  ? 'bg-black/20 border border-white/10 text-neutral-200'
                                  : 'bg-neutral-50 border border-neutral-200 text-neutral-800'
                              }`}
                            >
                              <option value="" className={isDark ? 'bg-[#252528]' : 'bg-white'}>Select city…</option>
                              {cityOptions.map((c) => (
                                <option key={c.code} value={c.code} className={isDark ? 'bg-[#252528]' : 'bg-white'}>{c.name}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={form.city}
                              onChange={(e) => set('city', e.target.value)}
                              placeholder="City"
                              disabled={!form.state}
                              className={`h-9 px-3 text-xs rounded-lg focus:outline-none focus:border-primary/50 disabled:opacity-40 ${
                                isDark
                                  ? 'bg-black/20 border border-white/10 text-neutral-200 placeholder:text-neutral-500'
                                  : 'bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400'
                              }`}
                            />
                          )}
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <input
                          value={form.address}
                          onChange={(e) => set('address', e.target.value)}
                          placeholder="Venue / local address *"
                          className={`w-full h-9 px-3 text-xs rounded-lg focus:outline-none focus:border-primary/50 ${
                            isDark
                              ? 'bg-black/20 border border-white/10 text-neutral-200 placeholder:text-neutral-500'
                              : 'bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400'
                          }`}
                        />
                      </div>
                      <div>
                        <input
                          value={form.pincode}
                          onChange={(e) => set('pincode', e.target.value)}
                          placeholder="Pincode *"
                          className={`w-full h-9 px-3 text-xs rounded-lg focus:outline-none focus:border-primary/50 ${
                            isDark
                              ? 'bg-black/20 border border-white/10 text-neutral-200 placeholder:text-neutral-500'
                              : 'bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── About ── */}
              <p className={`pt-2 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                About
              </p>

              {/* Description — expandable card */}
              <div
                className={`p-4 rounded-[14px] transition-colors ${
                  isDark
                    ? 'border border-white/10'
                    : 'border border-neutral-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  className={`w-full flex items-center gap-2.5 text-sm text-left font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}
                >
                  <span className={form.description ? (isDark ? 'text-white' : 'text-neutral-900 font-medium') : (isDark ? 'text-neutral-400' : 'text-neutral-500')}>
                    {form.description ? form.description.slice(0, 60) + (form.description.length > 60 ? '…' : '') : 'Add Description'}
                  </span>
                  <span className={`ml-auto text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{descExpanded ? '▲' : '▼'}</span>
                </button>
                {descExpanded && (
                  <textarea
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Tell attendees what to expect (schedule, prerequisites, networking)..."
                    rows={4}
                    className={`mt-3 w-full px-3 py-2.5 text-xs rounded-lg focus:outline-none focus:border-primary/50 resize-none ${
                      isDark
                        ? 'bg-black/20 border border-white/10 text-neutral-200 placeholder:text-neutral-500'
                        : 'bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400'
                    }`}
                  />
                )}
              </div>

              {/* Category Card */}
              <div
                className={`p-4 rounded-[14px] transition-colors ${
                  isDark
                    ? 'border border-white/10'
                    : 'border border-neutral-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>Category</span>
                  <span className="text-xs text-red-500">*</span>
                </div>
                <Select
                  value={form.category}
                  onValueChange={(val) => set('category', val)}
                >
                  <SelectTrigger
                    className={`w-full h-9 px-3 text-xs rounded-lg focus:ring-1 focus:ring-primary ${
                      isDark
                        ? 'bg-black/20 border border-white/10 text-neutral-200'
                        : 'bg-neutral-50 border border-neutral-200 text-neutral-800'
                    }`}
                  >
                    <SelectValue placeholder="Select a category…" />
                  </SelectTrigger>
                  <SelectContent
                    className={`rounded-xl shadow-2xl backdrop-blur-xl ${
                      isDark
                        ? 'border border-white/15 bg-[#252528] text-neutral-100'
                        : 'border border-neutral-200 bg-white text-neutral-900'
                    }`}
                  >
                    {EVENT_CATEGORIES.map((c) => (
                      <SelectItem key={c.id} value={c.label}>
                        <div className="flex items-center gap-2">
                          <c.icon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{c.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Event Options Card */}
              <div
                className={`p-4 rounded-[14px] space-y-4 transition-colors ${
                  isDark
                    ? 'border border-white/10'
                    : 'border border-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Event Options
                  </span>
                </div>

                {/* Payout gate banner */}
                {isPaidEvent && !payoutReady && (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <div className="text-xs text-amber-600 dark:text-amber-300">
                      <p className="font-medium">Set up payouts to receive money</p>
                      <p className="mt-0.5 opacity-85">
                        You're selling paid tickets but haven't added a verified bank account. Ticket revenue is held until verified.
                      </p>
                      <Link to="/organizer/payouts" className="inline-block mt-1 font-medium underline text-amber-600 dark:text-amber-400">
                        Set up payouts →
                      </Link>
                    </div>
                  </div>
                )}

                {/* Ticket Price (single-tier mode) */}
                {!form.useTicketTypes && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>Tickets</span>
                      <div className={`inline-flex rounded-lg p-0.5 ${isDark ? 'bg-black/20 border border-white/10' : 'bg-neutral-100 border border-neutral-200'}`}>
                        {([false, true] as const).map((isPaid) => (
                          <button
                            key={String(isPaid)}
                            type="button"
                            onClick={() => {
                              if (!isPaid) set('ticketPrice', '');
                              set('isPaid', isPaid);
                            }}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                              form.isPaid === isPaid
                                ? (isDark ? 'bg-white text-black shadow-sm' : 'bg-white text-neutral-900 shadow-sm')
                                : (isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900')
                            }`}
                          >
                            {isPaid ? 'Paid' : 'Free'}
                          </button>
                        ))}
                      </div>
                    </div>
                    {form.isPaid && (
                      <input
                        type="number"
                        min={0}
                        value={form.ticketPrice}
                        onChange={(e) => set('ticketPrice', e.target.value)}
                        placeholder="Price in ₹"
                        className={`w-full h-9 px-3 text-xs rounded-lg focus:outline-none focus:border-primary/50 ${
                          isDark
                            ? 'bg-black/20 border border-white/10 text-neutral-200 placeholder:text-neutral-500'
                            : 'bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400'
                        }`}
                      />
                    )}
                  </div>
                )}

                <div className={isDark ? 'h-px bg-white/10' : 'h-px bg-neutral-150'} />

                {/* Require Approval */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>Require Approval</p>
                    <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Review and approve guests before confirmation</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => set('requiresApproval', !form.requiresApproval)}
                    className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${
                      form.requiresApproval
                        ? 'bg-primary'
                        : (isDark ? 'bg-black/40 border border-white/20' : 'bg-neutral-200 border border-neutral-300')
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all bg-white shadow-sm ${form.requiresApproval ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className={isDark ? 'h-px bg-white/10' : 'h-px bg-neutral-150'} />

                {/* Capacity */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-xs font-medium ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>Capacity</p>
                    <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Maximum attendees allowed</p>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={form.capacity === 0 ? '' : form.capacity}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const cap = raw === '' ? 0 : (Number.isFinite(Number.parseInt(raw, 10)) ? Number.parseInt(raw, 10) : 0);
                      set('capacity', cap);
                      if (form.useTicketTypes) {
                        setForm((prev) => ({
                          ...prev,
                          capacity: cap,
                          ticketTypes: allocateTicketSeats(cap, prev.ticketTypes),
                        }));
                      }
                    }}
                    placeholder="Unlimited"
                    className={`w-24 h-8 px-2.5 text-xs text-right rounded-lg focus:outline-none focus:border-primary/50 ${
                      isDark
                        ? 'bg-black/20 border border-white/10 text-neutral-200 placeholder:text-neutral-500'
                        : 'bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400'
                    }`}
                  />
                </div>

                <div className={isDark ? 'h-px bg-white/10' : 'h-px bg-neutral-150'} />

                {/* Multiple ticket tiers toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className={`text-xs font-medium cursor-pointer select-none ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}
                      onClick={() => {
                        const next = !form.useTicketTypes;
                        setForm((prev) => ({
                          ...prev,
                          useTicketTypes: next,
                          ticketTypes: next ? allocateTicketSeats(prev.capacity, prev.ticketTypes) : prev.ticketTypes,
                        }));
                      }}
                    >
                      Multiple ticket tiers
                    </p>
                    <p className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Offer VIP, General, and Early bird passes</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !form.useTicketTypes;
                      setForm((prev) => ({
                        ...prev,
                        useTicketTypes: next,
                        ticketTypes: next ? allocateTicketSeats(prev.capacity, prev.ticketTypes) : prev.ticketTypes,
                      }));
                    }}
                    className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${
                      form.useTicketTypes
                        ? 'bg-primary'
                        : (isDark ? 'bg-black/40 border border-white/20' : 'bg-neutral-200 border border-neutral-300')
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all bg-white shadow-sm ${form.useTicketTypes ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              {/* Multi-tier ticket cards */}
              {form.useTicketTypes && (
                <div className="space-y-3">
                  <div
                    className={`px-4 py-3 rounded-[14px] space-y-2 ${
                      isDark
                        ? 'border border-white/10'
                        : 'border border-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>
                        Allocated: <span className={`font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{usedCapacity.toLocaleString()}</span> / {form.capacity.toLocaleString()}
                      </span>
                      <span className={remainingCapacity < 0 ? 'text-red-500 font-semibold' : remainingCapacity === 0 ? 'text-amber-500 font-semibold' : 'text-emerald-500 font-semibold'}>
                        {remainingCapacity < 0
                          ? `⚠ ${Math.abs(remainingCapacity)} over limit`
                          : remainingCapacity === 0
                          ? '✓ Fully allocated'
                          : `${remainingCapacity.toLocaleString()} unallocated`}
                      </span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-black/30' : 'bg-neutral-100'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${remainingCapacity < 0 ? 'bg-red-500' : 'bg-primary'}`}
                        style={{ width: `${Math.min(100, form.capacity > 0 ? (usedCapacity / form.capacity) * 100 : 0)}%` }}
                      />
                    </div>
                  </div>

                  {form.ticketTypes.map((ticket) => {
                    const otherUsed = form.ticketTypes
                      .filter((t) => t.id !== ticket.id && t.isEnabled)
                      .reduce((s, t) => s + t.count, 0);
                    const maxForThisTier = Math.max(0, form.capacity - otherUsed);

                    return (
                      <div
                        key={ticket.id}
                        className={`rounded-[14px] border p-3.5 space-y-3 transition-all ${
                          isDark
                            ? (ticket.isEnabled ? 'border-white/20' : 'border-white/5 opacity-50')
                            : (ticket.isEnabled ? 'border-neutral-200' : 'border-neutral-200/60 opacity-60')
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateTicket(ticket.id, { isEnabled: !ticket.isEnabled })}
                              className={`w-8 h-4.5 rounded-full relative transition-colors flex-shrink-0 ${
                                ticket.isEnabled
                                  ? 'bg-primary'
                                  : (isDark ? 'bg-black/40 border border-white/20' : 'bg-neutral-200 border border-neutral-300')
                              }`}
                            >
                              <span className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all bg-white shadow-sm ${ticket.isEnabled ? 'right-0.5' : 'left-0.5'}`} />
                            </button>
                            <input
                              value={ticket.name}
                              onChange={(e) => updateTicket(ticket.id, { name: e.target.value })}
                              className={`text-xs font-semibold bg-transparent border-none focus:outline-none px-1 w-32 ${isDark ? 'text-white' : 'text-neutral-900'}`}
                              placeholder="Tier name"
                            />
                          </div>
                          <div className="flex gap-1.5">
                            {Object.keys(TICKET_COLORS).map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => updateTicket(ticket.id, { color: c })}
                                className={`w-3.5 h-3.5 rounded-full border transition-all ${ticket.color === c ? 'border-foreground scale-125' : 'border-transparent'}`}
                                style={{ background: c === 'gold' ? '#D4A853' : c === 'silver' ? '#9CA3AF' : c === 'blue' ? '#3B82F6' : c === 'green' ? '#10B981' : '#8B5CF6' }}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <span className={`text-[11px] block mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Price (₹)</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={ticket.price === 0 ? '' : String(ticket.price)}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === '') { updateTicket(ticket.id, { price: 0 }); return; }
                                const digitsOnly = raw.replace(/[^\d]/g, '');
                                const nextPrice = digitsOnly === '' ? 0 : parseInt(digitsOnly, 10);
                                updateTicket(ticket.id, { price: nextPrice });
                              }}
                              className={`w-full h-8 px-2.5 text-xs rounded-lg focus:outline-none focus:border-primary/50 ${
                                isDark
                                  ? 'bg-black/20 border border-white/10 text-neutral-200 placeholder:text-neutral-500'
                                  : 'bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400'
                              }`}
                              placeholder="0 = free"
                            />
                          </div>
                          <div>
                            <span className={`text-[11px] block mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Seats</span>
                            <input
                              type="number"
                              min={0}
                              value={ticket.count === 0 ? '' : ticket.count}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const nextCount = raw === '' ? 0 : (Number.isFinite(Number.parseInt(raw, 10)) ? Number.parseInt(raw, 10) : 0);
                                handleTicketCountChange(ticket.id, nextCount);
                              }}
                              className={`w-full h-8 px-2.5 text-xs rounded-lg focus:outline-none focus:border-primary/50 ${
                                isDark
                                  ? 'bg-black/20 border border-white/10 text-neutral-200'
                                  : 'bg-neutral-50 border border-neutral-200 text-neutral-900'
                              } ${ticket.isEnabled && ticket.count > maxForThisTier ? 'border-red-400' : ''}`}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Benefits</span>
                            <button
                              type="button"
                              onClick={() => addBenefit(ticket.id)}
                              className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                            >
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {ticket.benefits.map((benefit, idx) => (
                              <div key={idx} className="flex items-center gap-1.5">
                                <span className="text-primary text-xs">✓</span>
                                <input
                                  value={benefit}
                                  onChange={(e) => updateBenefit(ticket.id, idx, e.target.value)}
                                  className={`h-7 px-2 text-xs flex-1 rounded-md focus:outline-none focus:border-primary/50 ${
                                    isDark
                                      ? 'bg-black/20 border border-white/10 text-neutral-200 placeholder:text-neutral-500'
                                      : 'bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400'
                                  }`}
                                  placeholder="e.g. VIP seating"
                                />
                                <button type="button" onClick={() => removeBenefit(ticket.id, idx)} className="text-neutral-400 hover:text-red-500 p-1">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Visibility & sharing ── */}
              <p className={`pt-2 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Visibility & sharing
              </p>

              {/* Top row: Calendar dropdown + Visibility toggle */}
              <div className="flex items-center justify-between gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors focus:outline-none ${
                        isDark
                          ? 'hover:bg-white/5 border border-white/10 text-neutral-200'
                          : 'hover:bg-neutral-100 border border-neutral-200 text-neutral-800'
                      }`}
                    >
                      <Calendar className={`w-3.5 h-3.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
                      <span>
                        {form.communityId && myCommunities?.find((c) => c.id === form.communityId)
                          ? `${myCommunities.find((c) => c.id === form.communityId)?.name} Calendar`
                          : 'Personal Calendar'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className={`w-64 p-2 rounded-xl shadow-2xl z-50 backdrop-blur-xl ${
                      isDark
                        ? 'border border-white/15 bg-[#252528] text-neutral-100'
                        : 'border border-neutral-200 bg-white text-neutral-900'
                    }`}
                  >
                    <div className={`text-[11px] font-semibold px-2 py-1 uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      Select Calendar
                    </div>
                    <DropdownMenuItem
                      onClick={() => set('communityId', '')}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        !form.communityId
                          ? (isDark ? 'bg-white/15 text-white font-medium' : 'bg-neutral-100 text-neutral-950 font-semibold')
                          : (isDark ? 'text-neutral-300 hover:bg-white/5' : 'text-neutral-700 hover:bg-neutral-100')
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Calendar className="w-3.5 h-3.5 shrink-0 opacity-70" />
                        <span className="text-xs truncate">Personal Calendar</span>
                      </div>
                      {!form.communityId && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </DropdownMenuItem>

                    {(myCommunities ?? []).length > 0 && (
                      <>
                        <div className={`text-[10px] font-semibold px-2 pt-2 pb-1 uppercase tracking-wider ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                          Communities
                        </div>
                        {myCommunities!.map((c) => {
                          const isActive = form.communityId === c.id;
                          return (
                            <DropdownMenuItem
                              key={c.id}
                              onClick={() => set('communityId', c.id)}
                              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                isActive
                                  ? (isDark ? 'bg-white/15 text-white font-medium' : 'bg-neutral-100 text-neutral-950 font-semibold')
                                  : (isDark ? 'text-neutral-300 hover:bg-white/5' : 'text-neutral-700 hover:bg-neutral-100')
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Building2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                <span className="text-xs truncate">{c.name} Calendar</span>
                              </div>
                              {isActive && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                            </DropdownMenuItem>
                          );
                        })}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-colors focus:outline-none ${
                        isDark
                          ? 'hover:bg-white/5 border border-white/10 text-neutral-200'
                          : 'hover:bg-neutral-100 border border-neutral-200 text-neutral-800'
                      }`}
                    >
                      {form.visibility === 'PRIVATE' ? (
                        <Sparkles className={`w-3.5 h-3.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
                      ) : (
                        <Globe className={`w-3.5 h-3.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`} />
                      )}
                      <span>{form.visibility === 'PRIVATE' ? 'Private' : 'Public'}</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className={`w-72 p-2 rounded-xl shadow-2xl z-50 backdrop-blur-xl ${
                      isDark
                        ? 'border border-white/15 bg-[#252528] text-neutral-100'
                        : 'border border-neutral-200 bg-white text-neutral-900'
                    }`}
                  >
                    <DropdownMenuItem
                      onClick={() => set('visibility', 'PUBLIC')}
                      className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors ${
                        form.visibility === 'PUBLIC'
                          ? (isDark ? 'bg-white/15 text-white' : 'bg-neutral-100 text-neutral-950 font-semibold')
                          : (isDark ? 'text-neutral-300 hover:bg-white/5' : 'text-neutral-700 hover:bg-neutral-100')
                      }`}
                    >
                      <Globe className="w-4 h-4 mt-0.5 shrink-0 opacity-70" />
                      <div className="flex-1 min-w-0 pr-1">
                        <p className={`text-xs font-medium leading-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>Public</p>
                        <p className={`text-[11px] mt-0.5 leading-snug ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                          Shown on your calendar and discoverable by anyone.
                        </p>
                      </div>
                      {form.visibility === 'PUBLIC' && <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => set('visibility', 'PRIVATE')}
                      className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer mt-1 transition-colors ${
                        form.visibility === 'PRIVATE'
                          ? (isDark ? 'bg-white/15 text-white' : 'bg-neutral-100 text-neutral-950 font-semibold')
                          : (isDark ? 'text-neutral-300 hover:bg-white/5' : 'text-neutral-700 hover:bg-neutral-100')
                      }`}
                    >
                      <Sparkles className="w-4 h-4 mt-0.5 shrink-0 opacity-70" />
                      <div className="flex-1 min-w-0 pr-1">
                        <p className={`text-xs font-medium leading-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>Private</p>
                        <p className={`text-[11px] mt-0.5 leading-snug ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                          Unlisted. Only people with the link can register.
                        </p>
                      </div>
                      {form.visibility === 'PRIVATE' && <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Community Card (optional) */}
              {(myCommunities?.length ?? 0) > 0 && (
                <div
                  className={`p-4 rounded-[14px] space-y-1.5 transition-colors ${
                    isDark
                      ? 'border border-white/10'
                      : 'border border-neutral-200'
                  }`}
                >
                  <label htmlFor="event-community" className={`block text-xs font-medium ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    Community (optional)
                  </label>
                  <Select
                    value={form.communityId || 'none'}
                    onValueChange={(val) => set('communityId', val === 'none' ? '' : val)}
                  >
                    <SelectTrigger
                      id="event-community"
                      className={`w-full h-10 px-3 text-sm rounded-xl focus:ring-1 focus:ring-primary ${
                        isDark
                          ? 'bg-black/20 border border-white/10 text-neutral-200'
                          : 'bg-neutral-50 border border-neutral-200 text-neutral-800'
                      }`}
                    >
                      <SelectValue placeholder="No community" />
                    </SelectTrigger>
                    <SelectContent
                      className={`rounded-xl shadow-2xl backdrop-blur-xl ${
                        isDark
                          ? 'border border-white/15 bg-[#252528] text-neutral-100'
                          : 'border border-neutral-200 bg-white text-neutral-900'
                      }`}
                    >
                      <SelectItem value="none">No community</SelectItem>
                      {myCommunities!.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Submit button */}
              <button
                type="button"
                className="w-full h-11 rounded-[12px] font-semibold text-sm active:scale-[0.99] transition-all shadow-md shadow-[#1981FE]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-[#1981FE] text-white hover:bg-[#1673e6]"
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEdit
                  ? (updateMutation.isPending ? 'Saving…' : 'Save Changes')
                  : (createMutation.isPending ? 'Creating…' : 'Create Event')}
              </button>

              {missingHints.length > 0 && (
                <p className={`text-center text-[11px] ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  Still needed: {missingHints.join(' · ')}
                </p>
              )}

            </div>
          </div>
        </div>
      </div>
      {/* Signed-out gate: pick a path, then sign in. Both steps are locked
          (no dismiss) — auth is required to use this page. */}
      <RoleChoiceModal
        open={gateStep === 'choose'}
        onOpenChange={() => {}}
        onChoose={(role) => setGateStep(role)}
        locked
      />
      <SignInModal
        open={gateStep === 'organizer' || gateStep === 'attendee'}
        onOpenChange={() => {}}
        onBack={() => setGateStep('choose')}
        locked
        roleIntent={gateStep === 'attendee' ? 'attendee' : 'organizer'}
        intendedRoute={gateStep === 'attendee' ? '/dashboard' : '/organizer/events/create'}
        title={gateStep === 'attendee' ? 'Sign in to attend events' : 'Sign in to create your event'}
        description={
          gateStep === 'attendee'
            ? 'Sign in to RSVP, get tickets, and connect at events.'
            : 'Save and publish your event in a moment, sign in with email or Google.'
        }
      />
    </OrganizerLayout>
  );
};

export default CreateEventPage;
