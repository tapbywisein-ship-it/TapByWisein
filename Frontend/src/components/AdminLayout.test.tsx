import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';

vi.mock('@/components/ThemeToggle', () => ({ NavbarThemeToggle: () => null, ThemeToggle: () => null }));
vi.mock('@/components/AppBackgroundGrid', () => ({ AppBackgroundGrid: () => null }));

import { AdminLayout } from './AdminLayout';

const renderLayout = () =>
  render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <AdminLayout>
        <p>Admin page</p>
      </AdminLayout>
    </MemoryRouter>
  );

describe('AdminLayout mobile "More" sheet', () => {
  beforeEach(() => {
    // An admin with no profile photo: the case that used to crash.
    useAppStore.setState({
      user: { id: 'a1', role: 'admin', name: 'Riya Admin', email: 'riya@example.com', avatar: undefined } as never,
    });
  });

  it('opens without crashing and shows the first letter of the name', () => {
    renderLayout();
    fireEvent.click(screen.getByRole('button', { name: 'More navigation' }));

    expect(screen.getAllByText('Riya Admin').length).toBeGreaterThan(0);
    expect(screen.getAllByText('R').length).toBeGreaterThan(0);
  });
});
