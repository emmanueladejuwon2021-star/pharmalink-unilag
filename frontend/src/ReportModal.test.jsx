import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReportModal from './components/ReportModal';

describe('EPIC-017: Content Reporting System (ReportModal.jsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays unverified barrier when unverified student attempts to report', () => {
    const handleClose = vi.fn();
    render(
      <ReportModal
        isOpen={true}
        onClose={handleClose}
        contentType="post"
        contentId="post-123"
        token="mock-token"
        user={{ verificationStatus: 'unverified' }}
      />
    );

    expect(screen.getByTestId('report-modal')).toBeInTheDocument();
    expect(screen.getByTestId('unverified-report-barrier')).toBeInTheDocument();
    expect(
      screen.getByText(/Only verified UNILAG Pharmacy students can submit moderation violation reports/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('report-form')).not.toBeInTheDocument();
  });

  it('renders report form with all faculty violation reasons for verified students', () => {
    const handleClose = vi.fn();
    render(
      <ReportModal
        isOpen={true}
        onClose={handleClose}
        contentType="post"
        contentId="post-123"
        token="mock-token"
        user={{ verificationStatus: 'verified' }}
      />
    );

    expect(screen.getByTestId('report-form')).toBeInTheDocument();
    expect(screen.getByTestId('report-reason-select')).toBeInTheDocument();
    expect(screen.getByTestId('report-description-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-report-btn')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-report-btn')).toBeInTheDocument();
  });

  it('successfully submits report and displays confirmation message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Report submitted successfully' })
    });

    const handleClose = vi.fn();
    render(
      <ReportModal
        isOpen={true}
        onClose={handleClose}
        contentType="post"
        contentId="post-123"
        token="mock-token"
        user={{ verificationStatus: 'verified' }}
      />
    );

    fireEvent.change(screen.getByTestId('report-reason-select'), {
      target: { value: 'harassment' }
    });
    fireEvent.change(screen.getByTestId('report-description-input'), {
      target: { value: 'Abusive language directed at junior students.' }
    });

    fireEvent.click(screen.getByTestId('submit-report-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('report-success-msg')).toBeInTheDocument();
      expect(
        screen.getByText(/Your report has been submitted to the moderation team/i)
      ).toBeInTheDocument();
    });
  });
});
