import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Download,
  Upload,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  FileText
} from 'lucide-react';
import {
  fetchMaterials,
  uploadMaterial,
  downloadMaterial,
  deleteMaterial
} from '../api/materials';

const DEPARTMENTS = [
  { code: 'CPH', name: 'Clinical Pharmacy and Biopharmacy' },
  { code: 'PCH', name: 'Pharmaceutical Chemistry' },
  { code: 'PCT', name: 'Pharmaceutics and Pharmaceutical Technology' },
  { code: 'PCG', name: 'Pharmacognosy' },
  { code: 'PCL', name: 'Pharmacology, Therapeutics and Toxicology' }
];

const ELIGIBLE_LEVELS = ['200L', '300L', '400L', '500L'];
const LEVEL_FILTERS = ['All Levels', '200L', '300L', '400L', '500L'];

const MATERIAL_TYPES = [
  'Lecture Note',
  'Past Question',
  'Lab Resource',
  'Summary Sheet',
  'Textbook / Reference',
  'Article / Guide'
];

const SEMESTERS = ['First Semester', 'Second Semester'];

export default function MaterialsSection({ user, token }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [downloading, setDownloading] = useState({});

  // Filter state
  const [selectedLevel, setSelectedLevel] = useState('All Levels');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('latest');

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showBarrierNotice, setShowBarrierNotice] = useState(false);

  const isVerified = Boolean(
    user?.verificationStatus === 'verified' || user?.role === 'admin'
  );

  const initialFormState = {
    title: '',
    courseCode: '',
    department: user?.department || 'CPH',
    level: user?.level || '300L',
    semester: 'First Semester',
    materialType: 'Lecture Note',
    academicSession: '2024/2025',
    fileUrl: '',
    fileName: '',
    description: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMaterials(token, {
        level: selectedLevel !== 'All Levels' ? selectedLevel : undefined,
        department: selectedDept !== 'all' ? selectedDept : undefined,
        materialType: selectedType !== 'all' ? selectedType : undefined,
        semester: selectedSemester !== 'all' ? selectedSemester : undefined,
        search: searchQuery.trim() || undefined,
        sort: selectedSort
      });
      setMaterials(data.materials || []);
    } catch (err) {
      setError(err.message || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadMaterials();
    }
  }, [token, selectedLevel, selectedDept, selectedType, selectedSemester, searchQuery, selectedSort]);

  const handleOpenUpload = () => {
    if (!isVerified) {
      setShowBarrierNotice(true);
      setError('Student verification is required to upload materials.');
      return;
    }
    setIsUploadModalOpen(true);
    setError(null);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Material title is required');
      return;
    }
    if (!formData.courseCode.trim()) {
      setError('Course code is required');
      return;
    }

    const finalFileName =
      formData.fileName.trim() ||
      `${formData.courseCode.trim().replace(/\s+/g, '')}_${formData.title.trim().replace(/\s+/g, '_')}.pdf`;
    const finalFileUrl =
      formData.fileUrl.trim() || `https://vault.unilag.edu.ng/files/${finalFileName}`;

    try {
      setUploading(true);
      setError(null);
      const res = await uploadMaterial(token, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        courseCode: formData.courseCode.trim().toUpperCase(),
        department: formData.department,
        level: formData.level,
        semester: formData.semester,
        materialType: formData.materialType,
        academicSession: formData.academicSession.trim() || '2024/2025',
        fileUrl: finalFileUrl,
        fileName: finalFileName
      });

      const newMaterial = res.material || {
        _id: 'm-' + Date.now(),
        ...formData,
        fileUrl: finalFileUrl,
        fileName: finalFileName,
        downloadsCount: 0,
        viewsCount: 0,
        uploader: {
          _id: user?._id,
          fullName: user?.fullName || 'Pharmacy Student',
          level: user?.level || formData.level
        },
        isUploader: true
      };

      setMaterials((prev) => [newMaterial, ...prev]);
      setIsUploadModalOpen(false);
      setFormData(initialFormState);
      setSuccessMsg('Academic material uploaded successfully to the Vault!');
    } catch (err) {
      setError(err.message || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (materialId) => {
    try {
      setDownloading((prev) => ({ ...prev, [materialId]: true }));
      setError(null);
      const res = await downloadMaterial(token, materialId);

      setMaterials((prev) =>
        prev.map((m) =>
          m._id === materialId
            ? {
                ...m,
                downloadsCount:
                  res.downloadsCount !== undefined
                    ? res.downloadsCount
                    : (m.downloadsCount || 0) + 1
              }
            : m
        )
      );
      setSuccessMsg(`Download initiated: ${res.fileName || 'Material document'}`);
    } catch (err) {
      setError(err.message || 'Failed to download material');
    } finally {
      setDownloading((prev) => ({ ...prev, [materialId]: false }));
    }
  };

  const handleDelete = async (materialId) => {
    try {
      setError(null);
      await deleteMaterial(token, materialId);
      setMaterials((prev) => prev.filter((m) => m._id !== materialId));
      setSuccessMsg('Academic material removed from the Vault.');
    } catch (err) {
      setError(err.message || 'Failed to delete material');
    }
  };

  return (
    <div className="card" data-testid="materials-section">
      {/* Header and Upload Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="var(--primary)" />
            Materials Vault & Academic Repository (EPIC-011 & EPIC-012)
          </h2>
          <p className="card-subtitle" style={{ marginBottom: 0 }}>
            Curated lecture notes, past questions, lab resources, and summary sheets for UNILAG Pharmacy.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={handleOpenUpload}
            className="submit-button"
            style={{ margin: 0, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            data-testid="open-upload-modal-btn"
          >
            <Upload size={14} />
            Upload Material
          </button>
        </div>
      </div>

      {/* Unverified student barrier */}
      {(!isVerified || showBarrierNotice) && (
        <div
          className="alert-box warning"
          style={{
            marginBottom: '16px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '12px'
          }}
          data-testid="unverified-material-barrier"
        >
          <AlertCircle size={16} color="#b45309" />
          <span>
            Student verification is required to upload materials. Please complete verification to contribute.
          </span>
        </div>
      )}

      {error ? (
        <div className="alert-box error" data-testid="materials-error" style={{ marginBottom: '16px' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      {successMsg ? (
        <div
          className="alert-box"
          style={{
            background: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #a7f3d0',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      ) : null}

      {/* Upload Modal / Form */}
      {isUploadModalOpen && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}
          data-testid="upload-material-modal"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>
              Upload Academic Material
            </h3>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              title="Close form"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleUploadSubmit} className="auth-form">
            <div className="form-group">
              <label>Material Title *</label>
              <input
                type="text"
                placeholder="e.g. CPH 401 Pharmacokinetics Complete Exam Revision Notes"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                data-testid="material-title-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Course Code *</label>
                <input
                  type="text"
                  placeholder="e.g. CPH 401"
                  value={formData.courseCode}
                  onChange={(e) => setFormData({ ...formData, courseCode: e.target.value })}
                  required
                  data-testid="material-course-input"
                />
              </div>

              <div className="form-group flex-1">
                <label>Department *</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  data-testid="material-dept-select"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.code} value={dept.code}>
                      {dept.code} - {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group flex-1">
                <label>Academic Level *</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  data-testid="material-level-select"
                >
                  {ELIGIBLE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Semester *</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  data-testid="material-semester-select"
                >
                  {SEMESTERS.map((sem) => (
                    <option key={sem} value={sem}>
                      {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group flex-1">
                <label>Material Type *</label>
                <select
                  value={formData.materialType}
                  onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                  data-testid="material-type-select"
                >
                  {MATERIAL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group flex-1">
                <label>Academic Session</label>
                <input
                  type="text"
                  placeholder="e.g. 2024/2025"
                  value={formData.academicSession}
                  onChange={(e) => setFormData({ ...formData, academicSession: e.target.value })}
                  data-testid="material-session-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>File URL</label>
                <input
                  type="text"
                  placeholder="https://storage.unilag.edu.ng/materials/sample.pdf"
                  value={formData.fileUrl}
                  onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                  data-testid="material-url-input"
                />
              </div>

              <div className="form-group flex-1">
                <label>File Name</label>
                <input
                  type="text"
                  placeholder="CPH401_Revision_Notes.pdf"
                  value={formData.fileName}
                  onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                  data-testid="material-filename-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description & Scope (Optional)</label>
              <textarea
                rows="2"
                placeholder="Key topics, lecture coverage, or practical notes included..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="material-description-input"
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="auth-tab-btn"
                style={{ padding: '6px 14px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-button"
                style={{ margin: 0, padding: '6px 16px' }}
                disabled={uploading}
                data-testid="submit-material-btn"
              >
                {uploading ? 'Uploading...' : 'Publish to Vault'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Bar */}
      <div
        style={{
          background: '#f8fafc',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {/* Row 1: Level selectors and search */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {LEVEL_FILTERS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`auth-tab-btn ${selectedLevel === lvl ? 'active' : ''}`}
                style={{ padding: '4px 8px', fontSize: '12px' }}
                data-testid={`filter-level-${lvl}`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: '8px', top: '7px', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search materials by title, course or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 8px 4px 28px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
                fontSize: '12px'
              }}
              data-testid="materials-search-input"
            />
          </div>
        </div>

        {/* Row 2: Dropdowns for Dept, Material Type, Semester, Sort */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              fontSize: '12px'
            }}
            data-testid="materials-dept-select"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept.code} value={dept.code}>
                {dept.code} - {dept.name}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              fontSize: '12px'
            }}
            data-testid="materials-type-select"
          >
            <option value="all">All Material Types</option>
            {MATERIAL_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              fontSize: '12px'
            }}
            data-testid="materials-semester-select"
          >
            <option value="all">All Semesters</option>
            {SEMESTERS.map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>

          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              fontSize: '12px',
              marginLeft: 'auto'
            }}
            data-testid="materials-sort-select"
          >
            <option value="latest">Sort: Latest</option>
            <option value="downloads">Sort: Most Downloaded</option>
            <option value="popular">Sort: Popular</option>
          </select>
        </div>
      </div>

      {/* Materials List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Loading academic materials from vault...
        </div>
      ) : materials.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '13px' }}>
          No academic materials found matching your filters. Be the first to upload one!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {materials.map((material) => {
            const isUploaderOrAdmin = Boolean(
              user &&
                (user.role === 'admin' ||
                  material.isUploader ||
                  (material.uploader?._id &&
                    material.uploader._id.toString() === user._id?.toString()) ||
                  (material.uploader?.matricNumber &&
                    material.uploader.matricNumber === user.matricNumber))
            );

            return (
              <div
                key={material._id}
                className="feature-box"
                data-testid={`material-card-${material._id}`}
                style={{ position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          background: 'var(--primary)',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}
                        data-testid={`material-course-${material._id}`}
                      >
                        {material.courseCode}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          background: '#e0e7ff',
                          color: '#3730a3',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}
                        data-testid={`material-type-${material._id}`}
                      >
                        {material.materialType}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          background: '#f1f5f9',
                          color: 'var(--text-muted)',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}
                      >
                        {material.department} &bull; {material.level}
                      </span>
                      {material.semester && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {material.semester}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', margin: '4px 0' }}>
                      {material.title}
                    </h3>

                    {material.description ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 8px 0', lineHeight: 1.4 }}>
                        {material.description}
                      </p>
                    ) : null}

                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        gap: '14px',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        marginTop: '8px'
                      }}
                    >
                      <span>
                        Uploaded by <strong>{material.uploader?.fullName || 'Pharmacy Student'}</strong> ({material.uploader?.level || material.level})
                      </span>
                      <span data-testid={`material-downloads-${material._id}`}>
                        <Download size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                        <strong>{material.downloadsCount || 0}</strong> Downloads
                      </span>
                      <span>
                        <Eye size={12} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                        {material.viewsCount || 0} Views
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => handleDownload(material._id)}
                      className="submit-button"
                      style={{
                        padding: '6px 12px',
                        margin: 0,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      data-testid={`download-material-btn-${material._id}`}
                      disabled={downloading[material._id]}
                    >
                      <Download size={13} />
                      {downloading[material._id] ? 'Downloading...' : 'Download'}
                    </button>

                    {isUploaderOrAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(material._id)}
                        className="auth-tab-btn"
                        style={{
                          padding: '4px 8px',
                          margin: 0,
                          fontSize: '11px',
                          color: '#dc2626',
                          borderColor: '#fca5a5',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        data-testid={`delete-material-btn-${material._id}`}
                        title="Delete material"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
