import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';

const day = 86_400_000;
const at = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString();
const reg = (id: string, status: string, title: string, startOffsetDays: number) => ({
  id,
  eventId: `ev-${id}`,
  status,
  event: { id: `ev-${id}`, title, startDate: at(startOffsetDays), endDate: at(startOffsetDays), city: 'Hyderabad' },
});

// Fake data: the strip should keep only upcoming, not-cancelled events, soonest first.
vi.mock('@/hooks/useEvents', () => ({
  useEvents: () => ({ data: { events: [] }, isLoading: false, isError: false, refetch: vi.fn() }),
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
vi.mock('@/components/QuickRegisterModal', () => ({ QuickRegisterModal: () => null }));

import { EventBrowser } from './EventBrowser';

const renderBrowser = () =>
  render(
    <MemoryRouter>
      <EventBrowser />
    </MemoryRouter>
  );

describe('EventBrowser - Your events', () => {
  beforeEach(() => useAppStore.setState({ isAuthenticated: true }));

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
