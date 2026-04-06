const express = require('express');
const {
  getComments,
  createComment,
  updateComment,
  deleteComment
} = require('../controllers/Comments');

const { protect, authorize } = require('../middleware/auth');

// IMPORTANT: need mergeParams to access req.params.hotelId when nested under /hotels/:hotelId/bookings
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getComments)
  .post(protect, createComment);

router
  .route('/:id')
  .put(protect, updateComment)
  .delete(protect, deleteComment);

module.exports = router;