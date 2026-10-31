import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

describe('Frontend Shell & App Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders application brand and navigation links', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        appName: 'PharmaLink UNILAG API',
        uptimeSeconds: 10
      })
    });

    render(<App />);

    expect(screen.getByText('PharmaLink UNILAG')).toBeInTheDocument();
    expect(screen.getByText('Materials Vault')).toBeInTheDocument();
    expect(screen.getByText('Social Feed')).toBeInTheDocument();
    expect(screen.getByText('Levels (200L–500L)')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('api-status-online')).toBeInTheDocument();
    });
  });

  it('handles offline / detached API gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('api-status-offline')).toBeInTheDocument();
    });
  });
});
