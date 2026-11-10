// Mock Fallback Data for BD-Pharm UNILAG
// Provides rich, authentic UNILAG Faculty of Pharmacy data when backend API is detached / static live hosting / demo mode.

export const FALLBACK_DEPARTMENTS = [
  { code: 'CPH', name: 'Clinical Pharmacy and Biopharmacy', courseCount: 4 },
  { code: 'PCH', name: 'Pharmaceutical Chemistry', courseCount: 4 },
  { code: 'PCT', name: 'Pharmaceutics and Pharmaceutical Technology', courseCount: 4 },
  { code: 'PCG', name: 'Pharmacognosy', courseCount: 3 },
  { code: 'PCL', name: 'Pharmacology, Therapeutics and Toxicology', courseCount: 3 }
];

export const FALLBACK_SESSION = {
  _id: 'sess-current',
  name: '2024/2025',
  currentSemester: 'First Semester',
  isCurrent: true
};

export const FALLBACK_COURSES = [
  // 200L
  {
    _id: 'c-pch201',
    code: 'PCH 201',
    title: 'Pharmaceutical Inorganic Chemistry',
    department: 'PCH',
    level: '200L',
    semester: 'First Semester',
    units: 2,
    description: 'Systematic study of inorganic pharmaceutical compounds, gastrointestinal agents, and radiopharmaceuticals.'
  },
  {
    _id: 'c-pct201',
    code: 'PCT 201',
    title: 'Physical Pharmacy I',
    department: 'PCT',
    level: '200L',
    semester: 'First Semester',
    units: 3,
    description: 'Thermodynamics of pharmaceutical systems, solubility, distribution phenomena, and phase equilibria.'
  },
  // 300L
  {
    _id: 'c-pch301',
    code: 'PCH 301',
    title: 'Medicinal Chemistry I',
    department: 'PCH',
    level: '300L',
    semester: 'First Semester',
    units: 3,
    description: 'Structure-activity relationships (SAR) of autonomic drugs, cholinergic agonists, adrenergic agents, and antihistamines.'
  },
  {
    _id: 'c-pct301',
    code: 'PCT 301',
    title: 'Dosage Form Design & Liquid Formulations',
    department: 'PCT',
    level: '300L',
    semester: 'First Semester',
    units: 3,
    description: 'Colloidal dispersions, emulsions, suspensions, rheology, and preservation of pharmaceutical liquid systems.'
  },
  {
    _id: 'c-pcg301',
    code: 'PCG 301',
    title: 'Phytochemistry & Separation Techniques',
    department: 'PCG',
    level: '300L',
    semester: 'First Semester',
    units: 3,
    description: 'Extraction, separation, TLC isolation, and chemical evaluation of secondary plant metabolites including alkaloids and glycosides.'
  },
  {
    _id: 'c-pcl301',
    code: 'PCL 301',
    title: 'Autonomic & Cardiovascular Pharmacology',
    department: 'PCL',
    level: '300L',
    semester: 'First Semester',
    units: 3,
    description: 'Pharmacodynamics and pharmacokinetics of antihypertensives, antiarrhythmics, diuretics, and autonomic agents.'
  },
  // 400L
  {
    _id: 'c-cph401',
    code: 'CPH 401',
    title: 'Clinical Pharmacokinetics & Drug Monitoring',
    department: 'CPH',
    level: '400L',
    semester: 'First Semester',
    units: 3,
    description: 'One-compartment and two-compartment kinetic models, steady-state clearance, dosing in organ dysfunction, and therapeutic drug monitoring.'
  },
  {
    _id: 'c-pct401',
    code: 'PCT 401',
    title: 'Sterile Products & Industrial Formulation',
    department: 'PCT',
    level: '400L',
    semester: 'First Semester',
    units: 3,
    description: 'Aseptic processing, parenteral formulations, pyrogen testing, lyophilization, and pharmaceutical cleanroom standards.'
  },
  {
    _id: 'c-pcl401',
    code: 'PCL 401',
    title: 'Chemotherapy & Neuropharmacology',
    department: 'PCL',
    level: '400L',
    semester: 'Second Semester',
    units: 3,
    description: 'Mechanisms of antimicrobial agents, antiviral chemotherapy, and central nervous system psychopharmacology.'
  },
  // 500L
  {
    _id: 'c-cph501',
    code: 'CPH 501',
    title: 'Applied Therapeutics & Hospital Pharmacy',
    department: 'CPH',
    level: '500L',
    semester: 'First Semester',
    units: 4,
    description: 'Evidence-based clinical disease management, clinical rotations, ward rounds, adverse drug reaction monitoring, and patient counseling.'
  }
];

export const FALLBACK_POSTS = [
  {
    _id: 'demo-post-01',
    title: 'Faculty Board Circular: Mid-Semester Continuous Assessment Timetable',
    content: 'Official PANS Executive Advisory: Continuous assessments for 200L to 500L Pharmacy students commence next Monday at the Faculty Lecture Theatres (LT1, LT2). Please verify your course forms and docket registration before Friday. Best of luck in your revisions!',
    category: 'PANS Official',
    level: 'All Levels',
    department: 'CPH',
    courseCode: null,
    tags: ['pans', 'exams', 'timetable'],
    isPinned: true,
    likesCount: 38,
    repliesCount: 6,
    reLinksCount: 14,
    viewsCount: 142,
    hasLiked: false,
    hasReLinked: false,
    hasBookmarked: false,
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    author: {
      _id: 'author-pans-exec',
      fullName: 'PANS Academic Secretariat',
      level: '500L',
      department: 'Clinical Pharmacy',
      verificationStatus: 'verified',
      role: 'pans_exec'
    },
    isAuthor: false
  },
  {
    _id: 'demo-post-02',
    title: 'CPH 401: Steady-State IV Bolus Kinetics & Creatinine Clearance Summary',
    content: 'Quick revision note for 400L Clinical Pharmacokinetics: For a one-compartment model with intermittent IV infusions, Css(max) = (Dose / Vd) * [1 / (1 - exp(-k * tau))]. Remember to adjust dosage regimens using Cockcroft-Gault estimates for patients with renal impairment! Full derivation slides are in the Materials Vault.',
    category: 'Academic Discussion',
    level: '400L',
    department: 'CPH',
    courseCode: 'CPH 401',
    tags: ['CPH401', 'pharmacokinetics', 'clinical'],
    isPinned: false,
    likesCount: 29,
    repliesCount: 5,
    reLinksCount: 9,
    viewsCount: 98,
    hasLiked: false,
    hasReLinked: false,
    hasBookmarked: false,
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    author: {
      _id: 'author-chidi',
      fullName: 'Chidi Okafor',
      level: '400L',
      department: 'CPH',
      verificationStatus: 'verified',
      role: 'student'
    },
    isAuthor: true
  },
  {
    _id: 'demo-post-03',
    title: 'PCG 301: Phytochemistry Laboratory Protocols & TLC Visualization Reagents',
    content: 'For 300L practicals tomorrow in Pharmacognosy lab: We will be running Dragendorff and Mayer tests for alkaloids in Rauwolfia vomitoria root powder. Remember to prepare solvent system: Chloroform:Methanol:Ammonia (85:14:1) in advance. Check fume cupboard ventilation before running chromatography tanks!',
    category: 'Lab & Practical',
    level: '300L',
    department: 'PCG',
    courseCode: 'PCG 301',
    tags: ['PCG301', 'pharmacognosy', 'phytochem', 'lab'],
    isPinned: false,
    likesCount: 22,
    repliesCount: 4,
    reLinksCount: 6,
    viewsCount: 76,
    hasLiked: false,
    hasReLinked: false,
    hasBookmarked: false,
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    author: {
      _id: 'author-amina',
      fullName: 'Amina Bello',
      level: '300L',
      department: 'PCG',
      verificationStatus: 'verified',
      role: 'student'
    },
    isAuthor: false
  },
  {
    _id: 'demo-post-04',
    title: 'PCT 201: Emulsion Formulation, HLB Values & Bancroft Rule Walkthrough',
    content: '200L Pharmaceutics students asking about HLB equations: Required HLB = (% oil A * HLB A) + (% oil B * HLB B). When emulsifying mineral oil (required HLB 10.5) with Span 80 (HLB 4.3) and Tween 80 (HLB 15), use the alligation method. Practice questions from 2021/2022 past exams are now uploaded to the Vault!',
    category: 'Exam Preparation',
    level: '200L',
    department: 'PCT',
    courseCode: 'PCT 201',
    tags: ['PCT201', 'pharmaceutics', 'physicalpharmacy'],
    isPinned: false,
    likesCount: 34,
    repliesCount: 7,
    reLinksCount: 11,
    viewsCount: 110,
    hasLiked: false,
    hasReLinked: false,
    hasBookmarked: false,
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    author: {
      _id: 'author-emeka',
      fullName: 'Emeka Nwosu',
      level: '200L',
      department: 'PCT',
      verificationStatus: 'verified',
      role: 'student'
    },
    isAuthor: false
  }
];

export const FALLBACK_MATERIALS = [
  {
    _id: 'mat-demo-01',
    title: 'Clinical Pharmacokinetics Compartmental Modeling & Dosage Equations',
    description: 'Comprehensive lecture notes on one-compartment and multi-compartment IV bolus and constant infusion models, with solved clearance examples.',
    courseCode: 'CPH 401',
    department: 'CPH',
    level: '400L',
    semester: 'First Semester',
    materialType: 'Lecture Note',
    academicSession: '2024/2025',
    fileUrl: 'https://storage.unilag.edu.ng/materials/cph401_kinetics.pdf',
    fileName: 'CPH401_Kinetics_Notes.pdf',
    downloadsCount: 42,
    viewsCount: 120,
    uploader: {
      _id: 'author-chidi',
      fullName: 'Chidi Okafor',
      level: '400L'
    },
    isUploader: true,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    _id: 'mat-demo-02',
    title: 'Medicinal Chemistry SAR Summary & Autonomic Drug Classifications',
    description: 'Detailed structure-activity relationship (SAR) tables for catecholamines, beta-blockers, parasympathomimetics, and H1/H2 receptor antagonists.',
    courseCode: 'PCH 301',
    department: 'PCH',
    level: '300L',
    semester: 'First Semester',
    materialType: 'Summary Sheet',
    academicSession: '2024/2025',
    fileUrl: 'https://storage.unilag.edu.ng/materials/pch301_sar.pdf',
    fileName: 'PCH301_SAR_Guide.pdf',
    downloadsCount: 56,
    viewsCount: 165,
    uploader: {
      _id: 'author-amina',
      fullName: 'Amina Bello',
      level: '300L'
    },
    isUploader: false,
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString()
  },
  {
    _id: 'mat-demo-03',
    title: 'Physical Pharmacy Past Questions & Complete Solutions (2018–2023)',
    description: 'Compiled UNILAG Faculty past semester exam papers with full numerical step-by-step solutions for HLB, buffer capacity, and dissolution kinetics.',
    courseCode: 'PCT 201',
    department: 'PCT',
    level: '200L',
    semester: 'First Semester',
    materialType: 'Past Question',
    academicSession: '2024/2025',
    fileUrl: 'https://storage.unilag.edu.ng/materials/pct201_past_questions.pdf',
    fileName: 'PCT201_Past_Questions_2018_2023.pdf',
    downloadsCount: 88,
    viewsCount: 230,
    uploader: {
      _id: 'author-pans-exec',
      fullName: 'PANS Academic Secretariat',
      level: '500L'
    },
    isUploader: false,
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString()
  },
  {
    _id: 'mat-demo-04',
    title: 'Pharmacognosy Secondary Metabolites & Chromatographic Isolation Lab Manual',
    description: 'Complete practical handbook containing reagent preparation, TLC spot identification charts, and alkaloid/flavonoid phytochemical testing steps.',
    courseCode: 'PCG 301',
    department: 'PCG',
    level: '300L',
    semester: 'First Semester',
    materialType: 'Lab Resource',
    academicSession: '2024/2025',
    fileUrl: 'https://storage.unilag.edu.ng/materials/pcg301_lab_guide.pdf',
    fileName: 'PCG301_Lab_Manual.pdf',
    downloadsCount: 37,
    viewsCount: 94,
    uploader: {
      _id: 'author-amina',
      fullName: 'Amina Bello',
      level: '300L'
    },
    isUploader: false,
    createdAt: new Date(Date.now() - 3600000 * 140).toISOString()
  }
];

export const FALLBACK_ANNOUNCEMENTS = [
  {
    _id: 'ann-demo-01',
    title: 'PANS 50th Annual Faculty Dinner & Pharmacist Oath Induction Gala',
    content: 'The Pharmaceutical Association of Nigerian Students (PANS UNILAG) cordially invites all Pharmacy students (200L–500L), faculty alumni, and lecturers to the 50th Golden Jubilee Gala. Dinner tickets and formal dress codes are available via your level representatives.',
    category: 'Events',
    priority: 'normal',
    targetLevels: ['All Levels'],
    isPinned: true,
    officialRole: 'PANS President',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    author: {
      _id: 'u-pans-pres',
      fullName: 'Babatunde Fashola',
      role: 'pans_exec'
    }
  },
  {
    _id: 'ann-demo-02',
    title: 'Urgent: Faculty Continuous Assessment Timetable Release',
    content: 'Official notice from the PANS Academic Directorate: Continuous assessment tests for 200L, 300L, 400L, and 500L commence next Monday across faculty lecture halls. Check the department boards for seating arrangements.',
    category: 'Academic',
    priority: 'urgent',
    targetLevels: ['All Levels'],
    isPinned: false,
    officialRole: 'Academic Committee Director',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    author: {
      _id: 'u-pans-acad',
      fullName: 'Chioma Okeke',
      role: 'pans_exec'
    }
  },
  {
    _id: 'ann-demo-03',
    title: 'Mandatory Level Rep Townhall: Faculty Welfare & Laboratory Reagent Allocations',
    content: 'All class representatives (200L–500L) are requested to attend a crucial consultative session regarding laboratory consumables, practical dockets, and student welfare support.',
    category: 'Dues & Welfare',
    priority: 'critical',
    targetLevels: ['300L', '400L', '500L'],
    isPinned: false,
    officialRole: 'General Secretary',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    author: {
      _id: 'u-pans-sec',
      fullName: 'Oluwaseun Adeleke',
      role: 'pans_exec'
    }
  }
];

export const FALLBACK_ADMIN_METRICS = {
  totalStudents: 142,
  verificationRate: 88,
  pendingVerifications: 4,
  totalPosts: 65,
  totalMaterials: 38,
  pendingReports: 2
};

export const FALLBACK_VERIFICATIONS = [
  {
    _id: 'req-demo-01',
    fullName: 'Emeka Nwosu',
    matricNumber: '200805099',
    level: '200L',
    documentType: 'UNILAG Student ID Card',
    documentUrl: 'https://storage.unilag.edu.ng/verifications/emeka_id.jpg',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    _id: 'req-demo-02',
    fullName: 'Khadijah Alabi',
    matricNumber: '190805140',
    level: '300L',
    documentType: 'Course Registration Form (Duly Signed)',
    documentUrl: 'https://storage.unilag.edu.ng/verifications/khadijah_form.pdf',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 16).toISOString()
  }
];

export const FALLBACK_USERS = [
  {
    _id: 'user-demo-admin',
    fullName: 'PANS Executive (Demo Admin)',
    matricNumber: '180805599',
    email: 'pans.exec@live.unilag.edu.ng',
    level: '500L',
    department: 'CPH',
    role: 'admin',
    verificationStatus: 'verified',
    isSuspended: false
  },
  {
    _id: 'user-demo-student',
    fullName: 'Chidi Okafor (Demo Student)',
    matricNumber: '190805501',
    email: 'chidi.okafor@live.unilag.edu.ng',
    level: '400L',
    department: 'PCL',
    role: 'student',
    verificationStatus: 'verified',
    isSuspended: false
  },
  {
    _id: 'user-demo-student-2',
    fullName: 'Amina Bello',
    matricNumber: '190805125',
    email: 'amina.bello@live.unilag.edu.ng',
    level: '300L',
    department: 'PCG',
    role: 'level_rep',
    verificationStatus: 'verified',
    isSuspended: false
  },
  {
    _id: 'user-demo-student-3',
    fullName: 'Ibrahim Musa',
    matricNumber: '200805055',
    email: 'imusa@live.unilag.edu.ng',
    level: '200L',
    department: 'PCT',
    role: 'student',
    verificationStatus: 'unverified',
    isSuspended: false
  }
];

export const FALLBACK_REPORTS = [
  {
    _id: 'rep-demo-01',
    contentType: 'post',
    contentId: 'p-flagged-01',
    reason: 'misinformation',
    description: 'Incorrect pediatric paracetamol dosing calculation in revision thread.',
    status: 'pending',
    reporter: { fullName: 'Amina Bello' },
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    _id: 'rep-demo-02',
    contentType: 'material',
    contentId: 'mat-flagged-02',
    reason: 'unauthorized_commercial',
    description: 'Promotional flyer uploaded instead of pharmacotherapy past questions.',
    status: 'pending',
    reporter: { fullName: 'Chidi Okafor' },
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

export const FALLBACK_NOTIFICATIONS = [
  {
    _id: 'notif-demo-01',
    type: 'like',
    message: 'Chioma Okeke and 3 others liked your CPH 401 kinetics revision note.',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    _id: 'notif-demo-02',
    type: 'comment',
    message: 'Amina Bello replied to your practicals discussion: "Check the fume cupboard..."',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    _id: 'notif-demo-03',
    type: 'announcement',
    message: 'New PANS Official Notice: PANS 50th Annual Faculty Dinner & Gala.',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    _id: 'notif-demo-04',
    type: 'verification_approved',
    message: 'Congratulations! Your UNILAG Faculty of Pharmacy student verification has been approved.',
    isRead: true,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];
