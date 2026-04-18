const express = require('express');
const { getComments, createComment, deleteComment } = require('../controllers/Comments');
const { protect } = require('../middleware/auth');

// mergeParams lets us access :hotelId from the parent Hotel router
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getComments)
  .post(protect, createComment);

router
  .route('/:id')
  .delete(protect, deleteComment);

module.exports = router;
