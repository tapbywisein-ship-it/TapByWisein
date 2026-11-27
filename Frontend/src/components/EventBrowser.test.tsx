import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { safePublicEventReturnPath } from '@/lib/loginReturnPath';

const day = 86_400_000;
const at = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString();
const reg = (id: string, status: string, title: string, startOffsetDays: number) => ({
  id,
  eventId: `ev-${id}`,
  status,
  event: { id: `ev-${id}`, title, startDate: at(startOffsetDays), endDate: at(startOffsetDays), city: 'Hyderabad' },
});

// The event list each test shows; empty unless a test fills it.
const mocks = vi.hoisted(() => ({ events: [] as unknown[] }));

// Fake data: the strip should keep only upcoming, not-cancelled events, soonest first.
vi.mock('@/hooks/useEvents', () => ({
  useEvents: () => ({ data: { events: mocks.events }, isLoading: false, isError: false, refetch: vi.fn() }),
  useSavedEvents: () => ({ data: { events: [] } }),
  useMyRegistrations: () => ({
    data: {
      registrations: [
        reg('a', 'REGISTERED', 'Later Meetup', 10),
        reg('b', 'WAITLISTED', 'Sooner Workshop', 2),
        reg('c', 'REGISTERED', 'Old Event', -5),
        reg('d', 'CANCELLED', 'Cancelled Event', 3),
      ],
    },
  }),
}));
vi.mock('@/components/SaveEventButton', () => ({ SaveEventButton: () => null }));
vi.mock('@/components/QuickRegisterModal', () => ({
  QuickRegisterModal: ({ event }: { event: { id: string } }) => (
    <div data-testid="quick-register-modal">{event.id}</div>
  ),
}));

import { EventBrowser } from './EventBrowser';

const renderBrowser = () =>
  render(
    <MemoryRouter>
      <EventBrowser />
    </MemoryRouter>
  );

describe('EventBrowser - Your events', () => {
  beforeEach(() => {
    mocks.events = [];
    useAppStore.setState({ isAuthenticated: true });
  });

  it('shows upcoming joined events, soonest first, without ended or cancelled ones', () => {
    renderBrowser();
    expect(screen.getByText('Your events')).toBeTruthy();
    const titles = screen
      .getAllByText(/^(Later Meetup|Sooner Workshop|Old Event|Cancelled Event)$/)
      .map((el) => el.textContent);
    expect(titles).toEqual(['Sooner Workshop', 'Later Meetup']);
    expect(screen.getByText('Waitlisted')).toBeTruthy();
    expect(screen.getByText('Going')).toBeTruthy();
  });

  it('is hidden for logged-out visitors', () => {
    useAppStore.setState({ isAuthenticated: false });
    renderBrowser();
    expect(screen.queryByText('Your events')).toBeNull();
  });
});

// Renders a real event card. The list used to be empty in every test, so a card
// that crashed (an undefined component) still passed and broke /events live.
describe('EventBrowser - event cards', () => {
  beforeEach(() => useAppStore.setState({ isAuthenticated: false }));

  it('shows an event card with its attendance count', () => {
    mocks.events = [
      {
        id: 'ev-card',
        title: 'Card Test Event',
        startDate: at(10),
        endDate: at(10),
        city: 'Hyderabad',
        category: 'Workshops',
        capacity: 100,
        registeredCount: 3,
        organizer: { profile: { firstName: 'QA', lastName: 'Org' } },
      },
    ];
    renderBrowser();
    expect(screen.getByText('Card Test Event')).toBeTruthy();
    expect(screen.getByText('3/100 attending')).toBeTruthy();
  });

  it('redirects guests to /login with return path on Register, title, and card image', () => {
    mocks.events = [
      {
        id: 'ev-card',
        title: 'Card Test Event',
        startDate: at(10),
        endDate: at(10),
        city: 'Hyderabad',
        category: 'Workshops',
        capacity: 100,
        registeredCount: 3,
        organizer: { profile: { firstName: 'QA', lastName: 'Org' } },
      },
    ];

    const LoginEcho = () => {
      const loc = useLocation();
      const fromState = (loc.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '';
      return <div data-testid="login-echo">{`${loc.pathname}${loc.search}|${fromState}`}</div>;
    };

    render(
      <MemoryRouter initialEntries={['/events']}>
        <Routes>
          <Route path="/events" element={<EventBrowser />} />
          <Route path="/login" element={<LoginEcho />} />
        </Routes>
      </MemoryRouter>
    );

    const links = screen.getAllByRole('link');
    expect(links.length).toBe(2);
    for (const link of links) {
      expect(link.getAttribute('href')).toBe('/login?from=%2Fevent%2Fev-card');
    }

    const registerBtn = screen.getByRole('button', { name: 'Register' });
    fireEvent.click(registerBtn);

    expect(screen.queryByTestId('quick-register-modal')).toBeNull();
    expect(screen.getByTestId('login-echo').textContent).toBe('/login?from=%2Fevent%2Fev-card|/event/ev-card');
  });

  it('preserves /e/:slug and /event/:id in safePublicEventReturnPath and rejects unsafe paths', () => {
    expect(safePublicEventReturnPath('/e/tech-conf')).toBe('/e/tech-conf');
    expect(safePublicEventReturnPath('/event/ev-card')).toBe('/event/ev-card');
    expect(safePublicEventReturnPath('//evil.com')).toBeUndefined();
    expect(safePublicEventReturnPath('/event/ev-card/extra')).toBeUndefined();
    expect(safePublicEventReturnPath('/dashboard')).toBeUndefined();
  });

  it('opens QuickRegisterModal and links to /e/:id when signed in', () => {
    useAppStore.setState({ isAuthenticated: true });
    mocks.events = [
      {
        id: 'ev-card',
        title: 'Card Test Event',
        startDate: at(10),
        endDate: at(10),
        city: 'Hyderabad',
        category: 'Workshops',
        capacity: 100,
        registeredCount: 3,
        organizer: { profile: { firstName: 'QA', lastName: 'Org' } },
      },
    ];

    renderBrowser();
    expect(screen.getByRole('link', { name: 'Card Test Event' }).getAttribute('href')).toBe('/e/ev-card');
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(screen.getByTestId('quick-register-modal').textContent).toBe('ev-card');
  });
});
