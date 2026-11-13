
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';

import {
  render,
  screen,
  fireEvent,
  cleanup,
} from '@testing-library/react';

import { MemoryRouter } from 'react-router-dom';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import React from 'react';

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div: (props: unknown) => (
      <div {...(props as React.HTMLAttributes<HTMLDivElement>)} />
    ),
  },
  AnimatePresence: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <>{children}</>,
}));

vi.mock('@/components/OrganizerLayout', () => ({
  OrganizerLayout: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (
    props: React.InputHTMLAttributes<HTMLInputElement>,
  ) => <input {...props} />,
}));

vi.mock('@/hooks/useOrganizer', () => ({
  useCreateEvent: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  usePublishEvent: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateEvent: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useRequestOrganizer: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// These tests only check the form UI.
// API requests are intentionally kept pending.
vi.mock('@/services/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api')>()),
  apiFetch: () => new Promise(() => {}),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Import after mocks.
import CreateEventPage from './CreateEvent';

// ── Query Client and Render Helper ────────────────────────────────────────────

let queryClient: QueryClient | undefined;

const renderPage = () => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CreateEventPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('CreateEvent - Event Type UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    cleanup();

    if (queryClient) {
      await queryClient.cancelQueries();
      queryClient.clear();
      queryClient = undefined;
    }
  });

  it('shows only "In Person" (no "Virtual" or "Hybrid")', () => {
    renderPage();

    fireEvent.click(
      screen.getByText(/Add Event Location/i),
    );

    const inPersonMatches = screen.getAllByText(/In Person/i);

    expect(inPersonMatches.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/Virtual/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hybrid/i)).not.toBeInTheDocument();
  });

  it('allocates seats by capacity (10/30/60) for multiple tiers', () => {
    renderPage();

    const multiTierLabel = screen.getByText(/Multiple ticket tiers/i);

    fireEvent.click(multiTierLabel);

    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('30')).toBeInTheDocument();
    expect(screen.getByDisplayValue('60')).toBeInTheDocument();
    expect(screen.getByText(/Fully allocated/i)).toBeInTheDocument();
  });
});

