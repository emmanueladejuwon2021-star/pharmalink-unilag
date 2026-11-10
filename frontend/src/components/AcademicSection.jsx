import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Search,
  PlusCircle,
  Filter,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Layers
} from 'lucide-react';
import {
  getDepartments,
  getCurrentAcademicSession,
  getCourses,
  createCourse,
  deleteCourse,
  createAcademicSession,
  setCurrentAcademicSession
} from '../api/academic';
import {
  FALLBACK_DEPARTMENTS,
  FALLBACK_SESSION,
  FALLBACK_COURSES
} from '../data/mockFallbackData';

const ELIGIBLE_LEVELS = ['200L', '300L', '400L', '500L'];
const SEMESTERS = ['First Semester', 'Second Semester'];

export default function AcademicSection({ user, token }) {
  const [departments, setDepartments] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [selectedLevel, setSelectedLevel] = useState(user?.level || 'all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Admin mod states
  const isAdmin = user && user.role === 'admin';
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [courseFormData, setCourseFormData] = useState({
    code: '',
    title: '',
    department: 'PCH',
    level: user?.level || '300L',
    semester: 'First Semester',
    units: 3,
    description: ''
  });
  const [newSessionData, setNewSessionData] = useState({
    name: '2025/2026',
    currentSemester: 'First Semester',
    isCurrent: true
  });

  const getFilteredFallbackCourses = () => {
    let list = [...FALLBACK_COURSES];
    if (selectedLevel !== 'all') {
      list = list.filter((c) => c.level === selectedLevel);
    }
    if (selectedDept !== 'all') {
      list = list.filter((c) => c.department === selectedDept);
    }
    if (selectedSemester !== 'all') {
      list = list.filter((c) => c.semester === selectedSemester);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) => c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)
      );
    }
    return list;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (token && token.startsWith('demo-')) {
        setDepartments(FALLBACK_DEPARTMENTS);
        setCurrentSession(FALLBACK_SESSION);
        setCourses(getFilteredFallbackCourses());
        return;
      }

      const [deptRes, sessionRes, courseRes] = await Promise.all([
        getDepartments(),
        getCurrentAcademicSession(),
        getCourses(token, {
          level: selectedLevel,
          department: selectedDept,
          semester: selectedSemester,
          search: searchQuery
        })
      ]);

      setDepartments(deptRes.departments || []);
      setCurrentSession(sessionRes.session || null);
      setCourses(courseRes.courses || []);
    } catch (err) {
      console.warn('Academic API error, falling back to sample curriculum:', err);
      setDepartments(FALLBACK_DEPARTMENTS);
      setCurrentSession(FALLBACK_SESSION);
      setCourses(getFilteredFallbackCourses());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, selectedLevel, selectedDept, selectedSemester, searchQuery]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (token && token.startsWith('demo-')) {
      const newCourse = {
        _id: 'c-demo-' + Date.now(),
        code: courseFormData.code.toUpperCase(),
        title: courseFormData.title,
        department: courseFormData.department,
        level: courseFormData.level,
        semester: courseFormData.semester,
        units: Number(courseFormData.units),
        description: courseFormData.description
      };
      setCourses((prev) => [newCourse, ...prev]);
      setSuccessMsg(`Course ${newCourse.code} created successfully.`);
      setShowAddCourse(false);
      setCourseFormData({
        code: '',
        title: '',
        department: 'PCH',
        level: user?.level || '300L',
        semester: 'First Semester',
        units: 3,
        description: ''
      });
      return;
    }

    try {
      setError(null);
      setSuccessMsg(null);
      const res = await createCourse(token, courseFormData);
      setSuccessMsg(res.message);
      setShowAddCourse(false);
      setCourseFormData({
        code: '',
        title: '',
        department: 'PCH',
        level: user?.level || '300L',
        semester: 'First Semester',
        units: 3,
        description: ''
      });
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteCourse = async (courseId, courseCode) => {
    if (!window.confirm(`Are you sure you want to delete course ${courseCode}?`)) return;
    if (token && token.startsWith('demo-')) {
      setCourses((prev) => prev.filter((c) => c._id !== courseId && c.code !== courseCode));
      setSuccessMsg(`Course ${courseCode} deleted successfully.`);
      return;
    }
    try {
      setError(null);
      await deleteCourse(token, courseId);
      setSuccessMsg(`Course ${courseCode} deleted successfully.`);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (token && token.startsWith('demo-')) {
      setCurrentSession({
        name: newSessionData.name,
        currentSemester: newSessionData.currentSemester,
        isCurrent: true
      });
      setSuccessMsg(`Academic session ${newSessionData.name} activated.`);
      setShowSessionModal(false);
      return;
    }
    try {
      setError(null);
      await createAcademicSession(token, newSessionData);
      setSuccessMsg(`Academic session ${newSessionData.name} activated.`);
      setShowSessionModal(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="card" data-testid="academic-section">
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={20} color="var(--primary)" />
            Academic Structure & Session Management (EPIC-004)
          </h2>
          <p className="card-subtitle" style={{ marginBottom: 0 }}>
            UNILAG Faculty of Pharmacy: 5 Specialized Departments, Levels 200L–500L, and Accredited Curricula.
          </p>
        </div>

        {/* Current Session Badge */}
        {currentSession ? (
          <div className="status-pill online" style={{ padding: '6px 12px', borderRadius: '8px' }} data-testid="current-session-badge">
            <Calendar size={14} />
            <span>
              Session: <strong>{currentSession.name}</strong> &bull; {currentSession.currentSemester}
            </span>
          </div>
        ) : null}
      </div>

      {/* Admin Action Bar */}
      {isAdmin ? (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setShowAddCourse(!showAddCourse)}
            className="submit-button"
            style={{ margin: 0, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            data-testid="toggle-add-course-btn"
          >
            <PlusCircle size={14} />
            {showAddCourse ? 'Close Form' : 'Register New Course'}
          </button>

          <button
            onClick={() => setShowSessionModal(!showSessionModal)}
            className="auth-tab-btn"
            style={{ background: '#f1f5f9', padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}
            data-testid="toggle-session-modal-btn"
          >
            <Calendar size={14} />
            {showSessionModal ? 'Close Session Setup' : 'Manage Academic Session'}
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="alert-box error" data-testid="academic-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      {successMsg ? (
        <div className="alert-box" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      ) : null}

      {/* Admin Add Course Form */}
      {showAddCourse && isAdmin ? (
        <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--primary)' }}>
            Register Course into BD-Pharm Curriculum
          </h4>
          <form onSubmit={handleCreateCourse} className="auth-form" data-testid="create-course-form">
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Course Code (e.g. PCH 301)</label>
                <input
                  type="text"
                  placeholder="PCH 301"
                  value={courseFormData.code}
                  onChange={(e) => setCourseFormData({ ...courseFormData, code: e.target.value })}
                  required
                  data-testid="course-code-input"
                />
              </div>
              <div className="form-group flex-1">
                <label>Course Title</label>
                <input
                  type="text"
                  placeholder="e.g. Medicinal Chemistry I"
                  value={courseFormData.title}
                  onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                  required
                  data-testid="course-title-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Department</label>
                <select
                  value={courseFormData.department}
                  onChange={(e) => setCourseFormData({ ...courseFormData, department: e.target.value })}
                  data-testid="course-dept-select"
                >
                  {departments.map((dept) => (
                    <option key={dept.code} value={dept.code}>
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group flex-1">
                <label>Academic Level</label>
                <select
                  value={courseFormData.level}
                  onChange={(e) => setCourseFormData({ ...courseFormData, level: e.target.value })}
                  data-testid="course-level-select"
                >
                  {ELIGIBLE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div className="form-group flex-1">
                <label>Semester</label>
                <select
                  value={courseFormData.semester}
                  onChange={(e) => setCourseFormData({ ...courseFormData, semester: e.target.value })}
                >
                  {SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ width: '90px' }}>
                <label>Units</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={courseFormData.units}
                  onChange={(e) => setCourseFormData({ ...courseFormData, units: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Syllabus & Course Description</label>
              <input
                type="text"
                placeholder="Brief course objectives and overview..."
                value={courseFormData.description}
                onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
              />
            </div>

            <button type="submit" className="submit-button" data-testid="save-course-btn">
              Save Course to BD-Pharm Catalog
            </button>
          </form>
        </div>
      ) : null}

      {/* Admin New Session Form */}
      {showSessionModal && isAdmin ? (
        <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--primary)' }}>
            Configure Active Academic Session
          </h4>
          <form onSubmit={handleCreateSession} className="auth-form" data-testid="create-session-form">
            <div className="form-row">
              <div className="form-group flex-1">
                <label>Academic Session (YYYY/YYYY)</label>
                <input
                  type="text"
                  placeholder="2025/2026"
                  value={newSessionData.name}
                  onChange={(e) => setNewSessionData({ ...newSessionData, name: e.target.value })}
                  required
                  data-testid="session-name-input"
                />
              </div>
              <div className="form-group flex-1">
                <label>Semester</label>
                <select
                  value={newSessionData.currentSemester}
                  onChange={(e) => setNewSessionData({ ...newSessionData, currentSemester: e.target.value })}
                >
                  {SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="submit-button" data-testid="save-session-btn">
              Set as Active Session
            </button>
          </form>
        </div>
      ) : null}

      {/* Departments Overview Cards */}
      <div style={{ marginBottom: '18px' }}>
        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
          Faculty Departments
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
          <div
            onClick={() => setSelectedDept('all')}
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              border: `1px solid ${selectedDept === 'all' ? 'var(--primary)' : 'var(--border)'}`,
              background: selectedDept === 'all' ? 'var(--primary-light)' : '#fff',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '12px' }}>All Departments</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Complete faculty curriculum</div>
          </div>
          {departments.map((dept) => (
            <div
              key={dept.code}
              onClick={() => setSelectedDept(selectedDept === dept.code ? 'all' : dept.code)}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                border: `1px solid ${selectedDept === dept.code ? 'var(--primary)' : 'var(--border)'}`,
                background: selectedDept === dept.code ? 'var(--primary-light)' : '#fff',
                cursor: 'pointer'
              }}
              data-testid={`dept-card-${dept.code}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary)' }}>{dept.code}</span>
                <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '10px' }}>
                  {dept.courseCount} courses
                </span>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 500, marginTop: '2px', lineHeight: 1.2 }}>
                {dept.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px', background: '#f8fafc', padding: '10px', borderRadius: '6px' }}>
        {/* Level filter */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setSelectedLevel('all')}
            className={`auth-tab-btn ${selectedLevel === 'all' ? 'active' : ''}`}
            style={{ padding: '4px 10px', fontSize: '12px' }}
          >
            All Levels
          </button>
          {ELIGIBLE_LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`auth-tab-btn ${selectedLevel === lvl ? 'active' : ''}`}
              style={{ padding: '4px 10px', fontSize: '12px' }}
              data-testid={`level-filter-${lvl}`}
            >
              {lvl} {user?.level === lvl ? '★' : ''}
            </button>
          ))}
        </div>

        {/* Semester Filter */}
        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '12px' }}
          data-testid="semester-filter"
        >
          <option value="all">All Semesters</option>
          <option value="First Semester">First Semester</option>
          <option value="Second Semester">Second Semester</option>
        </select>

        {/* Keyword Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
          <Search size={14} style={{ position: 'absolute', left: '8px', top: '7px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search course code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '4px 8px 4px 26px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '12px' }}
            data-testid="course-search-input"
          />
        </div>
      </div>

      {/* Course Catalog List */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>
            Curriculum Courses ({courses.length})
          </span>
          {loading && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Loading courses...</span>}
        </div>

        {courses.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
            No courses found matching the selected filters.
          </div>
        ) : (
          <div className="feature-grid" data-testid="courses-grid" style={{ marginTop: 0 }}>
            {courses.map((course) => (
              <div key={course._id} className="feature-box" data-testid={`course-card-${course.code}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary)' }}>
                    {course.code}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span style={{ fontSize: '10px', background: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      {course.units} Units
                    </span>
                    <span style={{ fontSize: '10px', background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      {course.level}
                    </span>
                  </div>
                </div>

                <h4 style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '4px', marginBottom: '4px' }}>
                  {course.title}
                </h4>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  <strong>Dept:</strong> {course.department} &bull; {course.semester}
                </div>

                {course.description ? (
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                    {course.description}
                  </p>
                ) : null}

                {isAdmin ? (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button
                      onClick={() => handleDeleteCourse(course._id, course.code)}
                      style={{ color: 'var(--danger)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      title="Delete Course"
                      data-testid={`delete-course-btn-${course.code}`}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
