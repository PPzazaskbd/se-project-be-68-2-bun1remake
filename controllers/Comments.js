const Comment = require('../models/Comment');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
// @desc    GET all comments
// @route   GET /api/v1/comments
// @access  Public
exports.getComments = async (req, res, next) => {
  let query;

  if (req.params.hotelId) {
    query = Comment.find({ hotel: req.params.hotelId });
  } 
  else {
    if (req.user.role !== 'admin') {
      query = Comment.find({ user: req.user.id });
    } else {
      query = Comment.find();
    }
  }

  try {
    const comments = await query.populate(
        [{
    path: 'hotel',
    select: 'name imgsrc'
  },
  {
    path: 'user',
    select: 'name email' 
  }]    
    );
    res.status(200).json({ success: true, count: comments.length, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Create new comments
// @route   POST /api/v1/comments
// @access  Private
exports.createComment = async (req, res, next) => {
  try {
    // Add hotelId to req.body from URL params
    req.body.hotel = req.params.hotelId;
    
    // Add userId to req.body from logged in user
    req.body.user = req.user.id;

    // Check if the hotel exists before commenting
    const hotel = await Hotel.findById(req.params.hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: "Hotel not found" });
    }

    const comment = await Comment.create(req.body);

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Could not create comment" });
  }
};

