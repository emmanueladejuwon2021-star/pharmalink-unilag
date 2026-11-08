const Material = require('../models/Material');
const User = require('../models/User');
const {
  MATERIAL_TYPES,
  isValidCourseCode,
  isValidDepartmentCode,
  isValidLevel,
  isValidSemester,
  isValidMaterialType,
  isValidAcademicSession
} = require('@pharmalink/shared');

/**
 * Upload a new academic material to the Materials Vault
 * POST /api/materials
 */
async function uploadMaterial(req, res, next) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    // Strict boundary: verified UNILAG students only can upload
    if (user.verificationStatus !== 'verified' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Student verification required. Please verify your student status to upload materials.'
      });
    }

    const {
      title,
      description,
      courseCode,
      department,
      level,
      semester,
      materialType,
      academicSession,
      fileUrl,
      fileName,
      fileSizeBytes,
      mimeType,
      isVerifiedOfficial
    } = req.body;

    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Material title is required and must be at least 3 characters long.'
      });
    }
    if (title.trim().length > 150) {
      return res.status(400).json({
        success: false,
        message: 'Material title cannot exceed 150 characters.'
      });
    }

    // Validate file details
    if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: 'File URL is required.'
      });
    }
    if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'File name is required.'
      });
    }

    // Validate course code
    if (!courseCode || typeof courseCode !== 'string' || !isValidCourseCode(courseCode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course code format. Expected format like "PCH 301" or "PCT 402".'
      });
    }

    // Validate department
    if (!department || typeof department !== 'string' || !isValidDepartmentCode(department)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department code. Must be CPH, PCH, PCT, PCG, or PCL.'
      });
    }

    // Validate academic level
    if (!level || typeof level !== 'string' || !isValidLevel(level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid academic level. Must be 200L, 300L, 400L, or 500L.'
      });
    }

    // Validate semester
    if (!semester || typeof semester !== 'string' || !isValidSemester(semester)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid semester. Must be "First Semester" or "Second Semester".'
      });
    }

    // Validate material type
    if (!materialType || typeof materialType !== 'string' || !isValidMaterialType(materialType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid material type. Must be one of: ${MATERIAL_TYPES.join(', ')}`
      });
    }

    // Validate optional academic session
    if (academicSession && !isValidAcademicSession(academicSession)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid academic session format. Expected format like "2024/2025".'
      });
    }

    const canMarkOfficial = ['admin', 'moderator', 'pans_exec'].includes(user.role);
    const verifiedOfficial = Boolean(isVerifiedOfficial && canMarkOfficial);

    const newMaterial = new Material({
      title: title.trim(),
      description: description && typeof description === 'string' ? description.trim() : '',
      uploader: user._id,
      courseCode: courseCode.trim().toUpperCase(),
      department: department.trim().toUpperCase(),
      level: level.trim(),
      semester: semester.trim(),
      materialType: materialType.trim(),
      academicSession: academicSession ? academicSession.trim() : null,
      fileUrl: fileUrl.trim(),
      fileName: fileName.trim(),
      fileSizeBytes: typeof fileSizeBytes === 'number' && fileSizeBytes >= 0 ? fileSizeBytes : 0,
      mimeType: mimeType && typeof mimeType === 'string' ? mimeType.trim() : 'application/pdf',
      isVerifiedOfficial: verifiedOfficial
    });

    await newMaterial.save();

    // Increment uploader stats and award +10 reputation points
    await User.findByIdAndUpdate(user._id, {
      $inc: {
        'stats.materialsCount': 1,
        'stats.reputationPoints': 10
      }
    });

    await newMaterial.populate('uploader', 'fullName level department verificationStatus role avatar matricNumber');

    return res.status(201).json({
      success: true,
      message: 'Material uploaded successfully.',
      material: newMaterial.toSafeMaterial(user._id)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve materials with filtering, search, sorting, and pagination
 * GET /api/materials
 */
async function getMaterials(req, res, next) {
  try {
    const {
      level,
      department,
      semester,
      courseCode,
      materialType,
      academicSession,
      search,
      sort,
      page = 1,
      limit = 20
    } = req.query;

    const query = { isDeleted: false };
    const andConditions = [];

    // Filter by academic level
    if (level && level !== 'all') {
      query.level = level.trim();
    }

    // Filter by department
    if (department && department !== 'all') {
      const deptUpper = department.trim().toUpperCase();
      if (isValidDepartmentCode(deptUpper)) {
        query.department = deptUpper;
      }
    }

    // Filter by semester
    if (semester && semester !== 'all') {
      query.semester = semester.trim();
    }

    // Filter by course code
    if (courseCode && courseCode !== 'all') {
      query.courseCode = courseCode.trim().toUpperCase();
    }

    // Filter by material type
    if (materialType && materialType !== 'all') {
      query.materialType = materialType.trim();
    }

    // Filter by academic session
    if (academicSession && academicSession !== 'all') {
      query.academicSession = academicSession.trim();
    }

    // Search query across title, description, or courseCode
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      andConditions.push({
        $or: [{ title: regex }, { description: regex }, { courseCode: regex }]
      });
    }

    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Sorting config
    let sortConfig = { createdAt: -1 };
    if (sort === 'downloads') {
      sortConfig = { downloadsCount: -1, createdAt: -1 };
    } else if (sort === 'popular') {
      sortConfig = { downloadsCount: -1, viewsCount: -1, likesCount: -1, createdAt: -1 };
    }

    const [materials, total] = await Promise.all([
      Material.find(query)
        .sort(sortConfig)
        .skip(skip)
        .limit(limitNum)
        .populate('uploader', 'fullName level department verificationStatus role avatar matricNumber'),
      Material.countDocuments(query)
    ]);

    const currentUserId = req.user ? req.user._id : null;
    const safeMaterials = materials.map((m) => m.toSafeMaterial(currentUserId));

    return res.status(200).json({
      success: true,
      materials: safeMaterials,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Retrieve single material details by ID and increment views
 * GET /api/materials/:id
 */
async function getMaterialById(req, res, next) {
  try {
    const { id } = req.params;

    const material = await Material.findOne({ _id: id, isDeleted: false }).populate(
      'uploader',
      'fullName level department verificationStatus role avatar matricNumber'
    );

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found.'
      });
    }

    // Increment viewsCount atomically
    await Material.findByIdAndUpdate(id, { $inc: { viewsCount: 1 } });
    material.viewsCount += 1;

    const currentUserId = req.user ? req.user._id : null;

    return res.status(200).json({
      success: true,
      material: material.toSafeMaterial(currentUserId)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Download material: record atomic download counter and award uploader reputation
 * GET/POST /api/materials/:id/download
 */
async function downloadMaterial(req, res, next) {
  try {
    const { id } = req.params;

    const material = await Material.findOne({ _id: id, isDeleted: false });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found.'
      });
    }

    // Atomically increment downloadsCount
    const updatedMaterial = await Material.findByIdAndUpdate(
      id,
      { $inc: { downloadsCount: 1 } },
      { new: true }
    );

    // Award uploader +2 reputation points
    if (material.uploader) {
      await User.findByIdAndUpdate(material.uploader, {
        $inc: { 'stats.reputationPoints': 2 }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Download initiated.',
      downloadUrl: material.fileUrl,
      fileName: material.fileName,
      downloadsCount: updatedMaterial ? updatedMaterial.downloadsCount : material.downloadsCount + 1
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update material details
 * PATCH /api/materials/:id
 */
async function updateMaterial(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    const material = await Material.findOne({ _id: id, isDeleted: false });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found.'
      });
    }

    const isUploader = material.uploader.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';

    if (!isUploader && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit this material.'
      });
    }

    const {
      title,
      description,
      courseCode,
      materialType,
      department,
      level,
      semester,
      academicSession
    } = req.body;

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Material title must be at least 3 characters.'
        });
      }
      if (title.trim().length > 150) {
        return res.status(400).json({
          success: false,
          message: 'Material title cannot exceed 150 characters.'
        });
      }
      material.title = title.trim();
    }

    if (description !== undefined) {
      material.description = typeof description === 'string' ? description.trim() : '';
    }

    if (courseCode !== undefined) {
      if (!isValidCourseCode(courseCode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid course code format.'
        });
      }
      material.courseCode = courseCode.trim().toUpperCase();
    }

    if (materialType !== undefined) {
      if (!isValidMaterialType(materialType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid material type. Must be one of: ${MATERIAL_TYPES.join(', ')}`
        });
      }
      material.materialType = materialType.trim();
    }

    if (department !== undefined) {
      if (!isValidDepartmentCode(department)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid department code.'
        });
      }
      material.department = department.trim().toUpperCase();
    }

    if (level !== undefined) {
      if (!isValidLevel(level)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid level.'
        });
      }
      material.level = level.trim();
    }

    if (semester !== undefined) {
      if (!isValidSemester(semester)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid semester.'
        });
      }
      material.semester = semester.trim();
    }

    if (academicSession !== undefined) {
      if (academicSession && !isValidAcademicSession(academicSession)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid academic session format.'
        });
      }
      material.academicSession = academicSession ? academicSession.trim() : null;
    }

    await material.save();
    await material.populate('uploader', 'fullName level department verificationStatus role avatar matricNumber');

    return res.status(200).json({
      success: true,
      message: 'Material updated successfully.',
      material: material.toSafeMaterial(user._id)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a material (soft delete)
 * DELETE /api/materials/:id
 */
async function deleteMaterial(req, res, next) {
  try {
    const { id } = req.params;
    const user = req.user;

    const material = await Material.findOne({ _id: id, isDeleted: false });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found.'
      });
    }

    const isUploader = material.uploader.toString() === user._id.toString();
    const isStaff = ['admin', 'moderator'].includes(user.role);

    if (!isUploader && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this material.'
      });
    }

    material.isDeleted = true;
    await material.save();

    // Decrement uploader material count
    await User.findByIdAndUpdate(material.uploader, {
      $inc: { 'stats.materialsCount': -1 }
    });

    return res.status(200).json({
      success: true,
      message: 'Material deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadMaterial,
  getMaterials,
  getMaterialById,
  downloadMaterial,
  updateMaterial,
  deleteMaterial
};
