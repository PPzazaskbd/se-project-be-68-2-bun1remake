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
      query = Comment.find();
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

// @desc    Update comment
// @route   PUT /api/v1/comments
// @access  Private
exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    //if comment not found then return
    if (!comment) {
      return res.status(404).json({ success: false });
    }

    res.status(200).json({ success: true, data: comment });
  } catch (err) {
    res.status(400).json({ success: false });
  }

};

// @desc    Delete comment
// @route   DELETE /api/v1/comments
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: `Comment not found with id ${req.params.id}`
      });
    }

    if (
      comment.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        message: `NOt authorized to delete this comment`
      }); 
    }
    await comment.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false });
  }

};
