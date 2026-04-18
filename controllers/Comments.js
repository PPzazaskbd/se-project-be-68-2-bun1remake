const Comment = require('../models/Comment');
const Hotel = require('../models/Hotel');

// @desc    GET all comments for a hotel
// @route   GET /api/v1/hotels/:hotelId/comments
// @access  Public
exports.getComments = async (req, res, next) => {
  try {
    let query;

    if (req.params.hotelId) {
      query = Comment.find({ hotel: req.params.hotelId });
    } else {
      query = Comment.find();
    }

    const comments = await query.populate([
      { path: 'hotel', select: 'name imgSrc' },
      { path: 'user', select: 'name email' }
    ]);

    res.status(200).json({ success: true, count: comments.length, data: comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create new comment
// @route   POST /api/v1/hotels/:hotelId/comments
// @access  Private
exports.createComment = async (req, res, next) => {
  try {
    req.body.hotel = req.params.hotelId;
    req.body.user = req.user.id;

    // Frontend may send 'comment' field; backend schema uses 'text'
    if (req.body.comment && !req.body.text) {
      req.body.text = req.body.comment;
      delete req.body.comment;
    }

    const hotel = await Hotel.findById(req.params.hotelId);
    if (!hotel) {
      return res.status(404).json({ success: false, message: 'Hotel not found' });
    }

    const comment = await Comment.create(req.body);

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not create comment' });
  }
};

// @desc    Delete comment
// @route   DELETE /api/v1/comments/:id
// @access  Private (owner or admin)
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Only allow owner or admin to delete
    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    await comment.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not delete comment' });
  }
};
