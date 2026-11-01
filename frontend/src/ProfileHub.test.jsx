import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

function jsonResponse(body, ok = true, status = 200) {
  return Promise.resolve({ ok, status, json: async () => body });
}

const studentUser = {
  _id: 'user-chioma',
  fullName: 'Chioma Okeke',
  email: 'cokeke@live.unilag.edu.ng',
  matricNumber: '190805123',
  level: '400L',
  role: 'student',
  verificationStatus: 'verified'
};

const myProfile = {
  _id: 'user-chioma',
  fullName: 'Chioma Okeke',
  level: '400L',
  role: 'student',
  verificationStatus: 'verified',
  restricted: false,
  bio: 'Clinical pharmacy enthusiast.',
  interests: ['Clinical Pharmacy & Therapeutics'],
  graduatingYear: 2027,
  profileVisibility: 'verified-only',
  matricNumberMasked: '190••••23',
  completeness: 100
};

const directoryProfiles = [
  {
    _id: 'user-tunde',
    fullName: 'Tunde Bakare',
    level: '300L',
    verificationStatus: 'verified',
    restricted: false,
    bio: 'Loves pharmacokinetics.',
    interests: ['Pharmacology'],
    graduatingYear: 2029,
    matricNumberMasked: '210••••11'
  },
  {
    _id: 'user-ada',
    fullName: 'Ada Obi',
    level: '200L',
    verificationStatus: 'unverified',
    restricted: false,
    bio: '',
    interests: [],
    graduatingYear: null,
    matricNumberMasked: '230••••88'
  }
];

function baseMock(url) {
  if (url.includes('/api/health')) return jsonResponse({ status: 'ok' });
  if (url.includes('/api/auth/me')) return jsonResponse({ success: true, user: studentUser });
  if (url.includes('/api/profiles/me')) {
    return jsonResponse({ success: true, profile: myProfile, academic: { session: '2025/2026', semester: 'First Semester', currentLevel: '400L' } });
  }
  if (url.includes('/api/profiles')) {
    return jsonResponse({ success: true, count: directoryProfiles.length, profiles: directoryProfiles });
  }
  return Promise.reject(new Error(`Unknown url: ${url}`));
}

describe('EPIC-005: Profile Hub (frontend)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders my profile with identity, completeness meter and saved fields', async () => {
    localStorage.setItem('pharmalink_token', 'valid-jwt-token');
    global.fetch = vi.fn().mockImplementation(baseMock);

    render(<App />);
    await waitFor(() => screen.getByTestId('user-session-badge'));
    fireEvent.click(screen.getByTestId('nav-profile'));

    expect(await screen.findByTestId('profile-hub')).toBeInTheDocument();
    expect(screen.getByTestId('my-profile-section')).toHaveTextContent('Chioma Okeke');
    expect(screen.getByTestId('my-profile-section')).toHaveTextContent('Verified Member');
    expect(screen.getByTestId('profile-completeness')).toHaveTextContent('100%');
    expect(screen.getByTestId('profile-bio-input')).toHaveValue('Clinical pharmacy enthusiast.');
    // Academic continuity shown on the profile header
    expect(screen.getByTestId('my-profile-section')).toHaveTextContent('2025/2026');
  });

  it('never exposes the full matric number on the profile view', async () => {
    localStorage.setItem('pharmalink_token', 'valid-jwt-token');
    global.fetch = vi.fn().mockImplementation(baseMock);

    render(<App />);
    await waitFor(() => screen.getByTestId('user-session-badge'));
    fireEvent.click(screen.getByTestId('nav-profile'));

    await screen.findByTestId('profile-hub');
    expect(document.body.textContent).not.toContain('190805123');
  });

  it('saves profile edits through PATCH /api/profiles/me', async () => {
    localStorage.setItem('pharmalink_token', 'valid-jwt-token');
    const updated = { ...myProfile, bio: 'Updated bio here.', interests: ['Pharmacology', 'Pharmacognosy'] };
    global.fetch = vi.fn().mockImplementation((url, options = {}) => {
      if (options.method === 'PATCH' && url.includes('/api/profiles/me')) {
        return jsonResponse({ success: true, message: 'Profile updated successfully.', profile: updated });
      }
      return baseMock(url);
    });

    render(<App />);
    await waitFor(() => screen.getByTestId('user-session-badge'));
    fireEvent.click(screen.getByTestId('nav-profile'));

    const bioInput = await screen.findByTestId('profile-bio-input');
    fireEvent.change(bioInput, { target: { value: 'Updated bio here.' } });

    // Toggle Pharmacognosy chip
    fireEvent.click(screen.getByText('Pharmacognosy'));

    fireEvent.click(screen.getByTestId('save-profile-btn'));

    expect(await screen.findByTestId('profile-success-alert')).toBeInTheDocument();
    const patchCall = global.fetch.mock.calls.find(
      ([url, options]) => options && options.method === 'PATCH' && url.includes('/api/profiles/me')
    );
    expect(patchCall).toBeDefined();
    const body = JSON.parse(patchCall[1].body);
    expect(body.bio).toBe('Updated bio here.');
    expect(body.interests).toContain('Pharmacognosy');
  });

  it('shows the member directory for verified students with level filter and search controls', async () => {
    localStorage.setItem('pharmalink_token', 'valid-jwt-token');
    global.fetch = vi.fn().mockImplementation(baseMock);

    render(<App />);
    await waitFor(() => screen.getByTestId('user-session-badge'));
    fireEvent.click(screen.getByTestId('nav-profile'));

    fireEvent.click(await screen.findByTestId('profile-tab-directory'));

    const list = await screen.findByTestId('member-list');
    expect(list).toHaveTextContent('Tunde Bakare');
    expect(list).toHaveTextContent('Ada Obi');
    expect(list).toHaveTextContent('Graduates 2029');

    // Client requests filtered directory when level changes
    fireEvent.change(screen.getByTestId('directory-level-filter'), { target: { value: '300L' } });
    await waitFor(() => {
      const lastCall = [...global.fetch.mock.calls].reverse().find(([u]) => u.includes('/api/profiles?') || u.includes('/api/profiles'));
      expect(lastCall[0]).toContain('level=300L');
    });
  });

  it('locks the member directory tab for unverified students', async () => {
    const unverifiedUser = { ...studentUser, verificationStatus: 'pending' };
    localStorage.setItem('pharmalink_token', 'valid-jwt-token');
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/auth/me')) return jsonResponse({ success: true, user: unverifiedUser });
      if (url.includes('/api/profiles/me')) {
        return jsonResponse({ success: true, profile: { ...myProfile, verificationStatus: 'pending' }, academic: null });
      }
      return baseMock(url);
    });

    render(<App />);
    await waitFor(() => screen.getByTestId('user-session-badge'));
    fireEvent.click(screen.getByTestId('nav-profile'));

    const dirTab = await screen.findByTestId('profile-tab-directory');
    expect(dirTab).toBeDisabled();
  });
});
