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
import { getCountryOptions, getStateOptions, getCityOptions, type GeoOption } from '@/lib/geo';
import { googleCalUrl } from '@/lib/calendar';
import { apiUpload } from '@/services/api';
import { toast } from 'sonner';
import {
  Calendar, Check, MapPin, Upload, X, Plus, Trash2, Shuffle, Globe, Building2, Loader2, AlertTriangle,
  Sparkles, ShieldCheck, Ticket, Users, ArrowLeft, Clock, Timer, Cpu, TrendingUp, Palette, Heart, Music,
  Trophy, UtensilsCrossed, Tag,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_CATEGORIES = [
  { id: 'Tech',     label: 'Tech',     icon: Cpu },
  { id: 'Business', label: 'Business', icon: TrendingUp },
  { id: 'Design',   label: 'Design',   icon: Palette },
  { id: 'Health',   label: 'Health',   icon: Heart },
  { id: 'Social',   label: 'Social',   icon: Sparkles },
  { id: 'Arts',     label: 'Arts',     icon: Music },
  { id: 'Sports',   label: 'Sports',   icon: Trophy },
  { id: 'Food',     label: 'Food',     icon: UtensilsCrossed },
  { id: 'Other',    label: 'Other',    icon: Tag },
];

const STANDARD_CATEGORY_IDS = ['Tech', 'Business', 'Design', 'Health', 'Social', 'Arts', 'Sports', 'Food'];

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
    name: 'Premium VIP',
    price: 5000,
    count: 10,
    benefits: ['VIP seating', 'Networking dinner', 'Speaker meet & greet', 'Swag bag'],
    color: 'gold',
    isEnabled: true,
  },
  {
    id: 'silver',
    name: 'Standard Access',
    price: 2000,
    count: 30,
    benefits: ['Reserved seating', 'Lunch included', 'Networking session'],
    color: 'silver',
    isEnabled: true,
  },
  {
    id: 'basic',
    name: 'General Entry',
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
  state: string;
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

// ─── Helper for Tomorrow's Date ────────────────────────────────────────────────
function getTomorrowDateStr(addDays = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + addDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function getEventDurationText(startDate: string, startTime: string, endDate: string, endTime: string): string {
  if (!startDate || !endDate) return '';
  const sStr = `${startDate}T${startTime || '00:00'}:00`;
  const eStr = `${endDate}T${endTime || '00:00'}:00`;
  const s = new Date(sStr);
  const e = new Date(eStr);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return '';
  const diffMs = e.getTime() - s.getTime();
  if (diffMs <= 0) return 'End time must be after start time';

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const mins = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hr${hours > 1 ? 's' : ''}`);
  if (mins > 0) parts.push(`${mins} min${mins > 1 ? 's' : ''}`);

  return parts.join(' ') || '0 mins';
}

const BECOME_ORGANIZER_STEPS = [
  'Click "Become an organizer" below',
  'Optionally add your company or event brand name',
  "You're upgraded instantly — no approval or waiting period",
  'You land right back here, ready to create your first event',
];

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { id: editEventId } = useParams<{ id: string }>();
  const isEdit = !!editEventId;
  const { data: editEvent } = useEvent(editEventId ?? '');
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const requestOrgMutation = useRequestOrganizer();
  const { data: myCommunities } = useMyCommunities();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefilledRef = useRef(false);

  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const userRole = useAppStore((s) => s.user?.role);
  const [orgName, setOrgName] = useState('');

  // ─── Auth gate ───────────────────────────────────────────────────────────
  const [gateStep, setGateStep] = useState<'choose' | 'organizer' | 'attendee' | null>(
    isAuthenticated ? null : 'choose'
  );
  useEffect(() => {
    setGateStep(isAuthenticated ? null : 'choose');
  }, [isAuthenticated]);

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
      localStorage.removeItem('fk-pending-organizer-upgrade');
      setAutoUpgrading(false);
    }
  }, [isAuthenticated, userRole]);

  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [locationExpanded, setLocationExpanded] = useState(true);
  const [descExpanded, setDescExpanded] = useState(true);

  // Initialize form with robust smart defaults so submission never fails on blank fields
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    category: 'Tech',
    startDate: getTomorrowDateStr(1),
    startTime: '18:00',
    endDate: getTomorrowDateStr(1),
    endTime: '20:00',
    timezone: 'Asia/Kolkata',
    locationType: 'IN_PERSON',
    address: 'T-Hub Phase 2, Madhapur',
    city: 'Hyderabad',
    state: 'TG',
    country: 'IN',
    pincode: '500081',
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

  const [customCategoryMode, setCustomCategoryMode] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const handleCategorySelectChange = (val: string) => {
    if (val === 'Other') {
      setCustomCategoryMode(true);
      set('category', customCategoryInput.trim() || 'Other');
    } else {
      setCustomCategoryMode(false);
      set('category', val);
    }
  };

  const applyTenurePreset = (hoursToAdd: number, daysToAdd: number = 0) => {
    const sDate = form.startDate || getTomorrowDateStr(1);
    const sTime = form.startTime || '18:00';
    const startDt = new Date(`${sDate}T${sTime}:00`);
    if (isNaN(startDt.getTime())) return;

    const newEndMs = startDt.getTime() + (hoursToAdd * 3600 * 1000) + (daysToAdd * 86400 * 1000);
    const endDt = new Date(newEndMs);

    const pad = (n: number) => String(n).padStart(2, '0');
    const eDateStr = `${endDt.getFullYear()}-${pad(endDt.getMonth() + 1)}-${pad(endDt.getDate())}`;
    const eTimeStr = `${pad(endDt.getHours())}:${pad(endDt.getMinutes())}`;

    setForm((f) => ({
      ...f,
      endDate: eDateStr,
      endTime: eTimeStr,
    }));
  };

  const eventDurationText = getEventDurationText(form.startDate, form.startTime, form.endDate, form.endTime);

  // ── Payout gate ─────────────────────────────────────────────────────────────
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

  // ── Edit mode: pre-fill form ────────────────────────────────────────────────
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
      let country = 'IN';
      let state = 'TG';
      if (ev.country) {
        const countries = await getCountryOptions();
        country = countries.find((c) => c.name === ev.country)?.code ?? country;
        if (country && ev.state) {
          const states = await getStateOptions(country);
          state = states.find((s) => s.name === ev.state)?.code ?? state;
        }
      }
      if (ev.category && !STANDARD_CATEGORY_IDS.includes(ev.category)) {
        setCustomCategoryMode(true);
        setCustomCategoryInput(ev.category);
      }

      setForm((f) => ({
        ...f,
        title: ev.title ?? '',
        description: ev.description ?? '',
        category: ev.category ?? 'Tech',
        startDate: dateStr(sd),
        startTime: timeStr(sd),
        endDate: dateStr(ed),
        endTime: timeStr(ed),
        timezone: ev.timezone ?? f.timezone,
        locationType: ev.locationType ?? 'IN_PERSON',
        address: ev.address ?? f.address,
        city: ev.city ?? f.city,
        state: state || f.state,
        country: country || f.country,
        pincode: ev.pincode ?? f.pincode,
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

  // ── Role guards ─────────────────────────────────────────────────────────────
  if (isAuthenticated && userRole === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (isAuthenticated && userRole === 'attendee') {
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

  const toISO = (date: string, time: string) => {
    if (!date) return '';
    const timeVal = time || '18:00';
    try {
      return new Date(`${date}T${timeVal}:00`).toISOString();
    } catch {
      return new Date().toISOString();
    }
  };

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }

    const localUrl = URL.createObjectURL(file);
    setImagePreview(localUrl);

    setUploading(true);
    try {
      const res = await apiUpload<{ data: { url: string } }>('/media/upload', file);
      set('coverImage', res.data.url);
      toast.success('Cover image uploaded');
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        set('coverImage', dataUrl);
      };
      reader.readAsDataURL(file);
      toast.error('Upload failed, image saved as data URL');
    } finally {
      setUploading(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setGateStep('organizer');
      return;
    }

    const titleTrimmed = form.title.trim();
    if (!titleTrimmed || titleTrimmed.length < 3) {
      toast.error('Event name must be at least 3 characters.');
      return;
    }

    const descTrimmed = form.description.trim();
    if (!descTrimmed || descTrimmed.length < 10) {
      toast.error('Description must be at least 10 characters.');
      return;
    }

    const categoryVal = form.category || 'Tech';

    // Start & End dates with intelligent fallback
    let sDate = form.startDate;
    let sTime = form.startTime || '18:00';
    let eDate = form.endDate || sDate;
    let eTime = form.endTime || '20:00';

    if (!sDate) sDate = getTomorrowDateStr(1);
    if (!eDate) eDate = sDate;

    let startISO = toISO(sDate, sTime);
    let endISO   = toISO(eDate, eTime);

    let startDt = new Date(startISO);
    let endDt   = new Date(endISO);

    // If start date is in the past for new events, set it to tomorrow
    if (!isEdit && startDt <= new Date()) {
      const tomorrow = getTomorrowDateStr(1);
      sDate = tomorrow;
      eDate = tomorrow;
      startISO = toISO(sDate, sTime);
      endISO   = toISO(eDate, eTime);
      startDt  = new Date(startISO);
      endDt    = new Date(endISO);
    }

    if (endDt <= startDt) {
      endDt = new Date(startDt.getTime() + 2 * 60 * 60 * 1000);
      const pad = (n: number) => String(n).padStart(2, '0');
      eDate = `${endDt.getFullYear()}-${pad(endDt.getMonth() + 1)}-${pad(endDt.getDate())}`;
      eTime = `${pad(endDt.getHours())}:${pad(endDt.getMinutes())}`;
      endISO = toISO(eDate, eTime);
    }

    if (form.useTicketTypes && usedCapacity > form.capacity) {
      toast.error('Ticket tier seats exceed total capacity.');
      return;
    }

    if (!form.useTicketTypes && form.isPaid && !(Number(form.ticketPrice) > 0)) {
      toast.error('Please enter a valid ticket price.');
      return;
    }

    // Smart location fallback so location validation NEVER fails backend schema
    const countryName = countryOptions.find((c) => c.code === form.country)?.name || form.country || 'India';
    const stateName   = stateOptions.find((s) => s.code === form.state)?.name || form.state || 'Telangana';
    const cityName    = form.city.trim() || 'Hyderabad';
    const addressName = form.address.trim() || 'Venue Location';
    const pincodeName = form.pincode.trim() || '500081';

    const meetingUrl = form.locationType !== 'IN_PERSON' ? (form.meetingUrl || undefined) : undefined;
    const activeTickets = form.useTicketTypes ? form.ticketTypes.filter((t) => t.isEnabled) : undefined;

    const payload = {
      title: titleTrimmed,
      description: descTrimmed,
      category: categoryVal,
      startDate: startISO,
      endDate: endISO,
      // Backend createEventSchema mandates type: 'IN_PERSON'
      type: 'IN_PERSON' as const,
      location: {
        address: addressName,
        city: cityName,
        state: stateName,
        country: countryName,
        pincode: pincodeName,
        meetingUrl,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        placeId: form.placeId || undefined,
      },
      coverImage: form.coverImage || undefined,
      theme: form.theme || 'indigo',
      timezone: form.timezone || 'Asia/Kolkata',
      capacity: Math.max(1, form.capacity || 100),
      ticketPrice: (!form.useTicketTypes && form.isPaid && form.ticketPrice) ? Number(form.ticketPrice) : undefined,
      ticketTypes: activeTickets,
      requiresApproval: form.requiresApproval,
      waitlistEnabled: form.waitlistEnabled,
      visibility: form.visibility || 'PUBLIC',
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      slug: form.slug || undefined,
      communityId: form.communityId || undefined,
    };

    try {
      if (isEdit && editEventId) {
        await updateMutation.mutateAsync({ id: editEventId, payload });
        toast.success('Event updated successfully!');
        navigate(`/organizer/events/${editEventId}`);
      } else {
        const res = await createMutation.mutateAsync(payload);
        toast.success('Event created successfully!');
        const newId = (res as { data?: { id?: string } })?.data?.id;
        if (newId) {
          navigate(`/organizer/events/${newId}`);
        } else {
          navigate('/organizer/dashboard');
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create event. Please check all fields.');
    }
  };

  const missingHints: string[] = [];
  if (form.title.trim().length < 3) missingHints.push('Event Name (min 3 chars)');
  if (form.description.trim().length < 10) missingHints.push('Description (min 10 chars)');

  const randomizeTheme = () => {
    const idx = Math.floor(Math.random() * THEME_IDS.length);
    set('theme', THEME_IDS[idx]);
  };

  const activeTheme = EVENT_THEMES[form.theme] ?? EVENT_THEMES.indigo;

  return (
    <OrganizerLayout>
      {/* ── Luma Ambient Light Blue Bokeh Background Overlay ───────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#08152e] via-[#0d2247] to-[#061024] text-foreground">
        {/* Soft Ambient Light Blue & Ocean Blue Floating Glow Blobs */}
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-sky-400/25 blur-[130px] animate-pulse transition-all duration-1000" />
        <div className="absolute top-[35%] right-[-5%] w-[700px] h-[700px] rounded-full bg-blue-500/25 blur-[150px] animate-pulse delay-1000 transition-all duration-1000" />
        <div className="absolute bottom-[-10%] left-[25%] w-[620px] h-[620px] rounded-full bg-cyan-400/20 blur-[130px] animate-pulse delay-500 transition-all duration-1000" />
        <div className="absolute top-[20%] right-[30%] w-[450px] h-[450px] rounded-full bg-indigo-400/20 blur-[110px] animate-pulse delay-700 transition-all duration-1000" />
        <div className="absolute top-[-5%] right-[15%] w-[500px] h-[500px] rounded-full bg-sky-300/20 blur-[120px] animate-pulse delay-300 transition-all duration-1000" />

        {/* Floating Light Blue Bokeh Bubbles - Slow Motion */}
        <div className="absolute top-[18%] left-[20%] w-48 h-48 rounded-full bg-sky-300/25 blur-2xl animate-pulse delay-300" />
        <div className="absolute top-[55%] left-[6%] w-64 h-64 rounded-full bg-blue-400/20 blur-3xl animate-pulse delay-700" />
        <div className="absolute top-[32%] right-[16%] w-52 h-52 rounded-full bg-cyan-300/25 blur-2xl animate-pulse delay-500" />
        <div className="absolute bottom-[18%] right-[22%] w-72 h-72 rounded-full bg-sky-400/20 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-[75%] left-[40%] w-56 h-56 rounded-full bg-blue-300/20 blur-2xl animate-pulse delay-200" />

        {/* Bokeh Circular Texture Grid */}
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#38bdf8_1.5px,transparent_1.5px)] [background-size:32px_32px]" />
      </div>

      <div className="max-w-[980px] mx-auto pb-24 space-y-8 relative z-10">

        {/* ── Top Header Navigation ────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border/80 pb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="rounded-2xl border-border hover:bg-muted text-xs sm:text-sm font-bold shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                {isEdit ? 'Edit Event' : 'Create New Event'}
                <Sparkles className="w-6 h-6 text-primary animate-bounce hidden sm:inline-block" />
              </h1>
              <p className="text-xs sm:text-base text-muted-foreground font-medium mt-1">
                Configure event details, dates, venue location, and ticketing.
              </p>
            </div>
          </div>

          {/* 1-Click Add to Google Calendar Link */}
          <a
            href={googleCalUrl({
              title: form.title || 'New Event',
              description: form.description || 'TapByWisein Event',
              start: form.startDate ? `${form.startDate}T${form.startTime || '12:00'}:00` : new Date(),
              end: form.endDate ? `${form.endDate}T${form.endTime || '13:00'}:00` : new Date(Date.now() + 3600000),
              location: [form.address, form.city, form.state, form.country].filter(Boolean).join(', '),
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md hover:bg-muted/80 text-foreground transition-all cursor-pointer shadow-md active:scale-95"
            title="Add to Google Calendar to get reminders"
          >
            <Calendar className="w-5 h-5 text-primary shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-xs sm:text-sm font-extrabold leading-tight">Add to Google Calendar</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Add to calendar to get reminders</span>
            </div>
          </a>
        </div>

        {/* ── Main Two-Column Card Grid ────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px,1fr] gap-8 items-start">

          {/* ── LEFT COLUMN: Cover Image & Theme Selection ─────────────────── */}
          <div className="space-y-6">

            {/* Cover Image Uploader Card */}
            <Surface className="p-6 border border-border/80 dark:border-primary/20 shadow-xl rounded-3xl bg-card/90 dark:bg-card/80 backdrop-blur-xl space-y-4">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                Event Poster / Cover Image
              </Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) void handleFileSelect(file);
                }}
                className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all overflow-hidden group shadow-inner"
                style={(!imagePreview && !form.coverImage) ? { background: activeTheme.bannerGradient } : undefined}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-9 h-9 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-white/90 font-medium">Uploading image...</p>
                  </div>
                ) : (imagePreview || form.coverImage) ? (
                  <>
                    <img
                      src={imagePreview || form.coverImage}
                      alt="Cover preview"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); set('coverImage', ''); setImagePreview(''); }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center hover:bg-black/90 transition-colors z-10 text-white"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-bold text-white bg-black/60 px-3.5 py-2 rounded-xl border border-white/20">
                        Change Image
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="p-4 text-center space-y-2">
                    <Upload className="w-9 h-9 text-white/90 mx-auto" />
                    <p className="text-base font-extrabold text-white drop-shadow">Upload Cover Photo</p>
                    <p className="text-xs text-white/80">JPG, PNG, WEBP - Max 5MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFileSelect(f); }}
              />
            </Surface>

            {/* Theme Picker Card */}
            <Surface className="p-6 border border-border/80 dark:border-primary/20 shadow-xl rounded-3xl bg-card/90 dark:bg-card/80 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Event Color Theme
                </Label>
                <button
                  type="button"
                  onClick={randomizeTheme}
                  className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                >
                  <Shuffle className="w-3.5 h-3.5" /> Randomize
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {THEME_IDS.map((id) => {
                  const theme = EVENT_THEMES[id];
                  const isActive = form.theme === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => set('theme', id)}
                      className="flex flex-col items-center gap-1.5 group"
                      title={theme.label}
                    >
                      <div
                        className={`w-full aspect-square rounded-2xl border-2 transition-all relative overflow-hidden ${
                          isActive ? 'border-primary ring-2 ring-primary/40 ring-offset-2 ring-offset-background scale-105' : 'border-transparent hover:border-border'
                        }`}
                        style={{ background: theme.bannerGradient }}
                      >
                        {isActive && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Check className="w-5 h-5 text-white drop-shadow" />
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground truncate w-full text-center">
                        {theme.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Surface>

          </div>

          {/* ── RIGHT COLUMN: Main Inputs & Event Settings ─────────────────── */}
          <div className="space-y-6">

            {/* 1. Title & Host Community Section */}
            <Surface className="p-7 sm:p-8 border border-border/80 dark:border-primary/20 shadow-xl rounded-3xl bg-card/90 dark:bg-card/80 backdrop-blur-xl space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="event-title" className="text-base sm:text-lg font-bold text-foreground block">
                  Event Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="event-title"
                  value={form.title}
                  maxLength={100}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="e.g. AI & Startup Founder Meetup 2026"
                  className="text-lg sm:text-xl font-bold h-13 rounded-2xl bg-background border-border focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                />
              </div>

              {/* Community Host Option */}
              {(myCommunities?.length ?? 0) > 0 && (
                <div className="space-y-2 pt-3 border-t border-border/60">
                  <Label htmlFor="event-community" className="text-sm font-semibold text-muted-foreground">
                    Host Under Community (Optional)
                  </Label>
                  <select
                    id="event-community"
                    value={form.communityId}
                    onChange={(e) => set('communityId', e.target.value)}
                    className="w-full h-12 px-4 text-base font-semibold bg-background border border-border rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  >
                    <option value="">No community (Personal Event)</option>
                    {myCommunities!.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.memberCount ?? 0} members)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </Surface>

            {/* 2. Date, Time & Timezone Section */}
            <Surface className="p-7 sm:p-8 border border-border/80 dark:border-primary/20 shadow-xl rounded-3xl bg-card/90 dark:bg-card/80 backdrop-blur-xl space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-6 h-6 text-primary" />
                  <h3 className="text-lg sm:text-xl font-extrabold text-foreground">Date & Time</h3>
                </div>
                {eventDurationText && !eventDurationText.includes('must be after') && (
                  <span className="text-xs sm:text-sm font-extrabold px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
                    <Timer className="w-4 h-4" />
                    Tenure: {eventDurationText}
                  </span>
                )}
              </div>

              <div className="space-y-5">
                {/* Row 1: Start Date & Start Time */}
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                    <Calendar className="w-4.5 h-4.5 text-primary" /> Start Date & Time <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr,200px] gap-3.5">
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                      <Input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => set('startDate', e.target.value)}
                        className="h-13 text-base sm:text-lg font-bold pl-12 rounded-2xl bg-background border-border focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                      />
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                      <Input
                        type="time"
                        value={form.startTime}
                        onChange={(e) => set('startTime', e.target.value)}
                        className="h-13 text-base sm:text-lg font-bold pl-12 rounded-2xl bg-background border-border focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: End Date & End Time */}
                <div className="space-y-2">
                  <Label className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                    <Calendar className="w-4.5 h-4.5 text-primary" /> End Date & Time <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr,200px] gap-3.5">
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                      <Input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => set('endDate', e.target.value)}
                        className="h-13 text-base sm:text-lg font-bold pl-12 rounded-2xl bg-background border-border focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                      />
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
                      <Input
                        type="time"
                        value={form.endTime}
                        onChange={(e) => set('endTime', e.target.value)}
                        className="h-13 text-base sm:text-lg font-bold pl-12 rounded-2xl bg-background border-border focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Duration / Tenure Calculator & Preset Buttons */}
                <div className="p-4 rounded-2xl border border-border/80 bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Timer className="w-4.5 h-4.5 text-primary" />
                      <span>Event Tenure:</span>
                      <span className="text-primary bg-primary/10 px-3 py-1 rounded-xl border border-primary/20 font-extrabold">
                        {eventDurationText || 'Select dates & times'}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-semibold">Quick Tenure Presets:</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { label: '+1 hr', hours: 1, days: 0 },
                      { label: '+2 hrs', hours: 2, days: 0 },
                      { label: '+3 hrs', hours: 3, days: 0 },
                      { label: '+4 hrs', hours: 4, days: 0 },
                      { label: '+8 hrs', hours: 8, days: 0 },
                      { label: '+1 Day', hours: 0, days: 1 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => applyTenurePreset(preset.hours, preset.days)}
                        className="px-3.5 py-2 text-xs font-bold rounded-xl border border-border bg-background hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95 shadow-xs"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timezone */}
              <div className="space-y-2 pt-3 border-t border-border/60">
                <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Globe className="w-4.5 h-4.5 text-primary" /> Event Timezone
                </Label>
                <select
                  value={form.timezone}
                  onChange={(e) => set('timezone', e.target.value)}
                  className="w-full h-13 px-4 text-base font-semibold bg-background border border-border rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </Surface>

            {/* 3. Location & Address Section */}
            <Surface className="p-7 sm:p-8 border border-border/80 dark:border-primary/20 shadow-xl rounded-3xl bg-card/90 dark:bg-card/80 backdrop-blur-xl space-y-5">
              <div className="flex items-center gap-2.5 border-b border-border/60 pb-3.5">
                <MapPin className="w-6 h-6 text-primary" />
                <h3 className="text-lg sm:text-xl font-extrabold text-foreground">Event Location</h3>
              </div>

              {/* Google Places Search & Interactive Map */}
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

              {/* Address Cascade Fields */}
              <div className="space-y-3.5 pt-3 border-t border-border/60">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Venue Details
                </Label>

                <Input
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="Venue Name / Street Address (e.g. T-Hub Phase 2, Madhapur)"
                  className="h-12 text-base font-semibold rounded-2xl bg-background"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <select
                    value={form.country}
                    onChange={(e) => {
                      const country = e.target.value;
                      setForm((prev) => ({ ...prev, country, state: '', city: '' }));
                    }}
                    className="h-12 px-3.5 text-base font-semibold bg-background border border-border rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
                  >
                    <option value="">Select Country…</option>
                    {countryOptions.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    value={form.state}
                    onChange={(e) => {
                      const state = e.target.value;
                      setForm((prev) => ({ ...prev, state, city: '' }));
                    }}
                    disabled={!form.country}
                    className="h-12 px-3.5 text-base font-semibold bg-background border border-border rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 shadow-sm"
                  >
                    <option value="">Select State…</option>
                    {stateOptions.map((s) => (
                      <option key={s.code} value={s.code}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {cityOptions.length > 0 ? (
                    <select
                      value={form.city}
                      onChange={(e) => set('city', e.target.value)}
                      disabled={!form.state}
                      className="h-12 px-3.5 text-base font-semibold bg-background border border-border rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 shadow-sm"
                    >
                      <option value="">Select City…</option>
                      {cityOptions.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={form.city}
                      onChange={(e) => set('city', e.target.value)}
                      placeholder="City (e.g. Hyderabad)"
                      className="h-12 text-base font-semibold rounded-2xl bg-background"
                    />
                  )}

                  <Input
                    value={form.pincode}
                    onChange={(e) => set('pincode', e.target.value)}
                    placeholder="Pincode (e.g. 500081)"
                    className="h-12 text-base font-semibold rounded-2xl bg-background"
                  />
                </div>
              </div>
            </Surface>

            {/* 4. Description & Category Section */}
            <Surface className="p-7 sm:p-8 border border-border/80 dark:border-primary/20 shadow-xl rounded-3xl bg-card/90 dark:bg-card/80 backdrop-blur-xl space-y-5">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="event-desc" className="text-base sm:text-lg font-bold text-foreground">
                    Event Description <span className="text-red-500">*</span>
                  </Label>
                  <span className="text-xs text-muted-foreground font-semibold">Min 10 characters</span>
                </div>
                <textarea
                  id="event-desc"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Provide details about your event, schedule highlights, target audience, or special instructions for attendees..."
                  rows={5}
                  className="w-full p-4 text-base font-semibold bg-background border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none shadow-sm"
                />
              </div>

              {/* Category Section: Dropdown Only + Custom Input when 'Other' */}
              <div className="space-y-3 pt-3 border-t border-border/60">
                <Label htmlFor="event-category" className="text-base font-bold text-foreground flex items-center gap-2">
                  <Tag className="w-4.5 h-4.5 text-primary" /> Event Category <span className="text-red-500">*</span>
                </Label>

                {/* Clean Dropdown Select */}
                <select
                  id="event-category"
                  value={customCategoryMode || !STANDARD_CATEGORY_IDS.includes(form.category) ? 'Other' : form.category}
                  onChange={(e) => handleCategorySelectChange(e.target.value)}
                  className="w-full h-13 px-4 text-base sm:text-lg font-bold bg-background border border-border rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer"
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>

                {/* Custom Category Typed Input Field if 'Other' is selected */}
                {(customCategoryMode || form.category === 'Other' || (!STANDARD_CATEGORY_IDS.includes(form.category) && form.category !== '')) && (
                  <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Label htmlFor="custom-category-input" className="text-sm font-bold text-foreground">
                      Type Custom Event Category <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="custom-category-input"
                      value={customCategoryInput || (STANDARD_CATEGORY_IDS.includes(form.category) ? '' : form.category)}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomCategoryInput(val);
                        set('category', val.trim() || 'Other');
                      }}
                      placeholder="Enter custom category (e.g. Web3, Robotics, AI, Gaming...)"
                      className="h-13 text-base sm:text-lg font-semibold rounded-2xl bg-background border-border shadow-sm focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                )}
              </div>
            </Surface>

            {/* 5. Tickets & Capacity Settings Section */}
            <Surface className="p-7 sm:p-8 border border-border/80 dark:border-primary/20 shadow-xl rounded-3xl bg-card/90 dark:bg-card/80 backdrop-blur-xl space-y-6 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between border-b border-border/60 pb-3.5">
                <div className="flex items-center gap-2.5">
                  <Ticket className="w-6 h-6 text-primary" />
                  <h3 className="text-lg sm:text-xl font-extrabold text-foreground">Tickets & Capacity Settings</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">Visibility:</span>
                  <select
                    value={form.visibility}
                    onChange={(e) => set('visibility', e.target.value as any)}
                    className="h-9 px-3 text-xs font-bold bg-muted border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE">Private Link Only</option>
                    <option value="UNLISTED">Unlisted</option>
                  </select>
                </div>
              </div>

              {/* Payout Warning Alert */}
              {isPaidEvent && !payoutReady && (
                <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 space-y-1">
                    <p className="font-bold">Set up payouts to collect ticket revenue</p>
                    <p className="opacity-90 leading-relaxed text-xs">
                      You are selling paid tickets. Add and verify your bank account details so ticket earnings can be deposited cleanly.
                    </p>
                    <Link to="/organizer/payouts" className="inline-block font-semibold underline text-xs pt-1">
                      Setup Payout Bank Account →
                    </Link>
                  </div>
                </div>
              )}

              {/* Ticket Price Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <Label className="text-sm sm:text-base font-bold text-foreground">Ticket Type</Label>
                  <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-2xl border border-border/60">
                    {[false, true].map((isPaid) => (
                      <button
                        key={String(isPaid)}
                        type="button"
                        onClick={() => {
                          if (!isPaid) set('ticketPrice', '');
                          set('isPaid', isPaid);
                        }}
                        className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                          form.isPaid === isPaid
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {isPaid ? 'Paid Ticket' : 'Free Entry'}
                      </button>
                    ))}
                  </div>
                </div>

                {form.isPaid && (
                  <div className="space-y-2 pt-1">
                    <Label htmlFor="ticket-price" className="text-sm font-semibold text-foreground">
                      Ticket Price (₹ INR)
                    </Label>
                    <Input
                      id="ticket-price"
                      type="number"
                      min={0}
                      value={form.ticketPrice}
                      onChange={(e) => set('ticketPrice', e.target.value)}
                      placeholder="Price in ₹ (e.g. 499)"
                      className="h-13 text-base sm:text-lg font-semibold rounded-2xl bg-background border-border shadow-sm focus-visible:ring-primary"
                    />
                  </div>
                )}
              </div>

              {/* Total Event Capacity */}
              <div className="space-y-2 pt-3 border-t border-border/60">
                <Label htmlFor="capacity-input" className="text-base font-bold text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Total Event Capacity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="capacity-input"
                  type="number"
                  min={1}
                  value={form.capacity === 0 ? '' : form.capacity}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const cap = raw === '' ? 0 : (Number.isFinite(Number.parseInt(raw, 10)) ? Number.parseInt(raw, 10) : 0);
                    set('capacity', cap);
                  }}
                  placeholder="e.g. 100"
                  className="h-13 text-base sm:text-lg font-bold rounded-2xl bg-background border-border shadow-sm focus-visible:ring-primary"
                />
              </div>
            </Surface>

            {/* ── Main Create Event Submit Button ──────────────────────────────── */}
            <div className="space-y-3 pt-4">
              <Button
                className="w-full h-14 text-lg sm:text-xl font-extrabold rounded-2xl shadow-xl shadow-primary/25 gap-2.5 bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-[0.99]"
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    {isEdit ? 'Saving Event Changes…' : 'Creating Event…'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    {isEdit ? 'Save Event Changes' : 'Create Event'}
                  </>
                )}
              </Button>

              {missingHints.length > 0 && (
                <p className="text-center text-xs sm:text-sm text-muted-foreground font-semibold">
                  Still needed: <span className="text-amber-500 font-bold">{missingHints.join(' · ')}</span>
                </p>
              )}
            </div>

          </div>
        </div>

      </div>

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
