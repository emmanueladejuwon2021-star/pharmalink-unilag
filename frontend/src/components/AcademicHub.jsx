import React, { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap,
  CalendarDays,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  ArrowUpCircle
} from 'lucide-react';
import {
  getCurrentPeriod,
  listCourses,
  getMyAcademicPeriod,
  updateMyAcademicPeriod,
  createCourse,
  promoteStudent
} from '../api/academic';

const SEMESTER_OPTIONS = ['First Semester', 'Second Semester'];
const LEVEL_OPTIONS = ['200L', '300L', '400L', '500L'];
const STAFF_ROLES = ['admin', 'moderator', 'pans_exec'];

export default function AcademicHub({ user, token, onLevelUpdated }) {
  const [livePeriod, setLivePeriod] = useState(null);
  const [myPeriod, setMyPeriod] = useState(null);
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState(user.level || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  // Staff-only course form state
  const isStaff = STAFF_ROLES.includes(user.role);
  const [newCourse, setNewCourse] = useState({ code: '', title: '', level: user.level, unit: 3 });
  const [promoteTargetId, setPromoteTargetId] = useState('');
  const [promoteReason, setPromoteReason] = useState('');

  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const data = await listCourses(token, { level: levelFilter || undefined });
      setCourses(data.courses);
    } catch (err) {
      setError(err.message);
    } finally {
      setCoursesLoading(false);
    }
  }, [token, levelFilter]);

  useEffect(() => {
    getCurrentPeriod()
      .then((data) => setLivePeriod(data.period))
      .catch(() => {});

    getMyAcademicPeriod(token)
      .then((data) => setMyPeriod(data.period))
      .catch((err) => setError(err.message));

    loadCourses();
  }, [loadCourses, token]);

  const handleSessionUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const form = new FormData(e.target);
      const data = await updateMyAcademicPeriod(token, {
        session: form.get('session'),
        semester: form.get('semester')
      });
      setMyPeriod(data.period);
      setSuccessMsg('Your academic period was saved.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const data = await createCourse(token, newCourse);
      setSuccessMsg(`Course ${data.course.code} added to the catalogue.`);
      setNewCourse({ code: '', title: '', level: user.level, unit: 3 });
      await loadCourses();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePromote = async (e) => {
    e.preventDefault();
    if (!promoteTargetId) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const data = await promoteStudent(token, promoteTargetId, promoteReason);
      setSuccessMsg(data.message);
      setPromoteTargetId('');
      setPromoteReason('');
      if (onLevelUpdated) onLevelUpdated(data.student);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const visibleCourses = courses.filter(
    (c) =>
      !searchTerm ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card" data-testid="academic-hub">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <GraduationCap color="var(--primary)" size={22} />
        <h3 className="card-title" style={{ margin: 0 }}>Academic Hub</h3>
      </div>
      <p className="card-subtitle">
        Your session, semester, and Faculty of Pharmacy course catalogue — kept in sync as you progress.
      </p>

      {error && (
        <div className="alert-box error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="alert-box success" data-testid="academic-success-alert">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Current academic period */}
      <section style={{ marginBottom: '16px' }} data-testid="current-period-section">
        <h4 style={{ margin: '0 0 6px', fontSize: '13px' }}>
          <CalendarDays size={14} style={{ verticalAlign: 'middle' }} /> University Calendar
        </h4>
        {livePeriod ? (
          <p style={{ margin: 0, fontSize: '12px' }}>
            It is currently the <strong>{livePeriod.semester}</strong> of the{' '}
            <strong>{livePeriod.session}</strong> academic session.
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
            Loading university calendar...
          </p>
        )}
      </section>

      {/* My academic record */}
      {myPeriod && (
        <section style={{ marginBottom: '16px' }} data-testid="my-period-section">
          <h4 style={{ margin: '0 0 6px', fontSize: '13px' }}>My Academic Record</h4>
          <p style={{ margin: '0 0 8px', fontSize: '12px' }}>
            Level: <strong data-testid="my-current-level">{myPeriod.currentLevel}</strong>
            {' • '}Session: <strong>{myPeriod.session}</strong>
            {' • '}Semester: <strong>{myPeriod.semester}</strong>
          </p>

          <form onSubmit={handleSessionUpdate} className="auth-form" data-testid="period-update-form">
            <div className="form-group">
              <label htmlFor="sessionSelect">Academic Session</label>
              <select id="sessionSelect" name="session" defaultValue={myPeriod.session}>
                {(livePeriod?.sessions || [myPeriod.session]).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="semesterSelect">Semester</label>
              <select id="semesterSelect" name="semester" defaultValue={myPeriod.semester}>
                {SEMESTER_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="submit-button" disabled={saving} data-testid="save-period-btn">
              {saving ? 'Saving...' : 'Save My Academic Period'}
            </button>
          </form>

          {myPeriod.progressionHistory?.length > 0 && (
            <div style={{ marginTop: '10px', fontSize: '12px' }} data-testid="progression-history">
              <strong>Progression history:</strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
                {myPeriod.progressionHistory.map((entry, i) => (
                  <li key={i}>
                    {entry.fromLevel} → {entry.toLevel} ({entry.session}, {entry.semester})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Course catalogue */}
      <section data-testid="course-catalogue">
        <h4 style={{ margin: '0 0 6px', fontSize: '13px' }}>
          <BookOpen size={14} style={{ verticalAlign: 'middle' }} /> Course Catalogue
        </h4>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <div className="form-group" style={{ flex: '1 1 140px', margin: 0 }}>
            <select
              aria-label="Filter courses by level"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              data-testid="course-level-filter"
            >
              <option value="">All levels</option>
              {LEVEL_OPTIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ flex: '2 1 180px', margin: 0, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '8px', top: '9px', opacity: 0.5 }} />
            <input
              type="text"
              placeholder="Search course code or title"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '26px' }}
              data-testid="course-search-input"
            />
          </div>
        </div>

        {coursesLoading ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            <Loader2 size={13} className="spin" /> Loading courses...
          </p>
        ) : visibleCourses.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }} data-testid="no-courses-message">
            No courses found for this filter yet. Admins and moderators can add them below.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '12px' }}>
            {visibleCourses.map((c) => (
              <li key={c._id} className="course-row" data-testid={`course-${c.code}`}>
                <span className="course-code">{c.code}</span>
                <span className="course-title">{c.title}</span>
                <span className="course-meta">{c.level}{c.unit ? ` • ${c.unit} units` : ''}{c.semester ? ` • ${c.semester}` : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Staff tools */}
      {isStaff && (
        <section style={{ marginTop: '16px' }} data-testid="staff-academic-tools">
          <h4 style={{ margin: '0 0 6px', fontSize: '13px' }}>Staff Tools</h4>

          <form onSubmit={handleAddCourse} className="auth-form" data-testid="add-course-form">
            <div className="form-group">
              <label htmlFor="courseCode">New Course Code (e.g. PHR301)</label>
              <input
                id="courseCode"
                type="text"
                required
                value={newCourse.code}
                onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="courseTitle">Course Title</label>
              <input
                id="courseTitle"
                type="text"
                required
                value={newCourse.title}
                onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="courseLevel">Level</label>
              <select
                id="courseLevel"
                value={newCourse.level}
                onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
              >
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="submit-button" disabled={saving} data-testid="add-course-btn">
              Add Course to Catalogue
            </button>
          </form>

          <form onSubmit={handlePromote} className="auth-form" data-testid="promote-student-form">
            <div className="form-group">
              <label htmlFor="promoteId">Student ID to Promote</label>
              <input
                id="promoteId"
                type="text"
                placeholder="Paste student account ID"
                value={promoteTargetId}
                onChange={(e) => setPromoteTargetId(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="promoteReason">Reason (Optional)</label>
              <input
                id="promoteReason"
                type="text"
                value={promoteReason}
                onChange={(e) => setPromoteReason(e.target.value)}
              />
            </div>
            <button type="submit" className="submit-button" disabled={saving || !promoteTargetId} data-testid="promote-student-btn">
              <ArrowUpCircle size={13} style={{ verticalAlign: 'middle' }} /> Promote One Level
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
