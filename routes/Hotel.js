const express = require('express');
const {
  getHotels,
  getHotel,
  createHotel,
  updateHotel,
  deleteHotel
} = require('../controllers/Hotels');

const { protect, authorize } = require('../middleware/auth');

const bookingRouter = require('./bookings');
const commentRouter = require('./comment');

const router = express.Router();

router.use('/:hotelId/bookings', bookingRouter);
router.use('/:hotelId/comments', commentRouter);

router
  .route('/')
  .get(getHotels)
  .post(protect, authorize('admin'), createHotel);

router
  .route('/:id')
  .get(getHotel)
  .put(protect, authorize('admin'), updateHotel)
  .delete(protect, authorize('admin'), deleteHotel);

module.exports = router;