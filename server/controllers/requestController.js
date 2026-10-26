const Request = require('../models/Request');
const Sample = require('../models/Sample');
const { generateId } = require('../utils/idGenerator');
const { logAudit, notifyUser } = require('../utils/eventLogger');

// @desc Get all requests (scoped by role, with pagination, search, status filter)
// @route GET /api/v1/requests
// @access Private
const getAllRequests = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Requesters can only view their own requests
    if (req.user.role === 'requester') {
      query.requester = req.user._id;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    if (req.query.sampleType) {
      query.sampleType = req.query.sampleType;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [{ requestCode: searchRegex }, { title: searchRegex }, { purpose: searchRegex }];
    }

    const total = await Request.countDocuments(query);
    const requests = await Request.find(query)
      .populate('requester', 'name email organization phone')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: requests,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Create a new request
// @route POST /api/v1/requests
// @access Private (Requesters, Lab Staff, Admin)
const createRequest = async (req, res, next) => {
  try {
    const { title, purpose, sampleType, priority } = req.body;

    const requestCode = await generateId(Request, 'REQ');

    const newRequest = await Request.create({
      requestCode,
      requester: req.user._id,
      title,
      purpose: purpose || '',
      sampleType,
      priority: priority || 'routine',
      status: 'submitted',
    });

    const populatedRequest = await Request.findById(newRequest._id).populate(
      'requester',
      'name email organization'
    );

    await logAudit({
      user: req.user._id,
      action: 'REQUEST_SUBMITTED',
      entityType: 'Request',
      entityId: newRequest._id,
      details: `Requisition ${requestCode} submitted: ${title}`,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Sequencing request submitted successfully',
      data: populatedRequest,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get request details by ID
// @route GET /api/v1/requests/:id
// @access Private (Requester must own request, or staff/admin)
const getRequestById = async (req, res, next) => {
  try {
    const requestDoc = await Request.findById(req.params.id)
      .populate('requester', 'name email organization phone')
      .populate('reviewedBy', 'name email role');

    if (!requestDoc) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    // Role check: requester can only view own request
    if (
      req.user.role === 'requester' &&
      requestDoc.requester._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot view requests from other investigators.',
      });
    }

    // Find linked samples
    const samples = await Sample.find({ request: requestDoc._id })
      .populate('registeredBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...requestDoc.toObject(),
        samples,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc Review & update request status
// @route PATCH /api/v1/requests/:id/status
// @access Lab Staff, Admin
const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, reviewNotes } = req.body;

    const validStatuses = [
      'submitted',
      'under_review',
      'approved',
      'rejected',
      'in_progress',
      'completed',
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const requestDoc = await Request.findById(req.params.id);
    if (!requestDoc) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    requestDoc.status = status;
    requestDoc.reviewedBy = req.user._id;
    if (reviewNotes !== undefined) {
      requestDoc.reviewNotes = reviewNotes;
    }

    await requestDoc.save();

    await logAudit({
      user: req.user._id,
      action: `REQUEST_${status.toUpperCase()}`,
      entityType: 'Request',
      entityId: requestDoc._id,
      details: `Request ${requestDoc.requestCode} status updated to ${status}. Notes: ${reviewNotes || 'None'}`,
      req,
    });

    await notifyUser({
      recipient: requestDoc.requester,
      title: `Requisition ${requestDoc.requestCode} ${status.toUpperCase()}`,
      message: `Your sequencing study "${requestDoc.title}" has been updated to ${status.replace('_', ' ')}.`,
      type: 'request',
      link: `/requests/${requestDoc._id}`,
    });

    const updated = await Request.findById(requestDoc._id)
      .populate('requester', 'name email organization')
      .populate('reviewedBy', 'name email role');

    res.status(200).json({
      success: true,
      message: `Request status updated to ${status}`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllRequests,
  createRequest,
  getRequestById,
  updateRequestStatus,
};
