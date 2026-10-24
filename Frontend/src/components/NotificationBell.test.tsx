import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

let unread = 0;
vi.mock('@/hooks/useNotifications', () => ({ useUnreadCount: () => ({ data: unread }) }));

import { NotificationBell } from './NotificationBell';

const renderBell = () =>
  render(
    <MemoryRouter>
      <NotificationBell />
    </MemoryRouter>
  );

describe('NotificationBell', () => {
  it('shows no number when nothing is unread', () => {
    unread = 0;
    renderBell();
    expect(screen.getByRole('link', { name: 'Notifications' })).toHaveAttribute('href', '/notifications');
    expect(screen.queryByText(/\d/)).not.toBeInTheDocument();
  });

  it('shows the unread count on the bell', () => {
    unread = 3;
    renderBell();
    expect(screen.getByRole('link', { name: 'Notifications, 3 unread' })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('caps the number at 9+', () => {
    unread = 14;
    renderBell();
    expect(screen.getByText('9+')).toBeInTheDocument();
  });
});
