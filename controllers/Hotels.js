const Hotel = require('../models/Hotel');
const Booking = require('../models/booking');
const hotelFilter = require('../utils/filter');

// @desc    GET all hotels
// @route   GET /api/v1/hotels
// @access  Public
exports.getHotels = async (req, res, next) => {
  const reqQuery = { ...req.query };

  const removeFields = ['select', 'sort', 'page', 'limit'];
  removeFields.forEach(param => delete reqQuery[param]);

  let mongoQuery = {};

  if (reqQuery.priceRange) {
    const p = reqQuery.priceRange;
    if (p === '1') mongoQuery.price = { $lt: 30 };
    else if (p === '2') mongoQuery.price = { $gte: 30, $lt: 80 };
    else if (p === '3') mongoQuery.price = { $gte: 80, $lt: 200 };
    else if (p === '4') mongoQuery.price = { $gte: 200 };
    delete reqQuery.priceRange;
  }

  if (reqQuery.review) {
    mongoQuery.review = { $gte: Number(reqQuery.review) };
    delete reqQuery.review;
  }
  
  if (reqQuery.facility) {
    const facilities = reqQuery.facility.split(',');
    mongoQuery["specializations.facility"] = { $all: facilities };
    delete reqQuery.facility;
  }

  let remainingQueryStr = JSON.stringify(reqQuery);
  remainingQueryStr = remainingQueryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, m => `$${m}`);

  const finalQuery = { ...JSON.parse(remainingQueryStr), ...mongoQuery };

  let query = Hotel.find(finalQuery);

  if (req.query.select) {
    const fields = req.query.select.split(',').join(' ');
    query = query.select(fields);
  }
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const total = await Hotel.countDocuments(finalQuery);

  query = query.skip(startIndex).limit(limit);
  const hotels = await query;

  const pagination = {};
  if ((page * limit) < total) pagination.next = { page: page + 1, limit };
  if (startIndex > 0) pagination.prev = { page: page - 1, limit };
  
  res.status(200).json({
    success: true,
    count: hotels.length,
    pagination,
    data: hotels
  });
};

// @desc    GET single hotel
// @route   GET /api/v1/hotels/:id
// @access  Public
exports.getHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({ success: false });
    }

    res.status(200).json({ success: true, data: hotel });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Create new hotel
// @route   POST /api/v1/hotels
// @access  Private (admin)
exports.createHotel = async (req, res, next) => {
  const hotel = await Hotel.create(req.body);

  res.status(201).json({
    success: true,
    data: hotel
  });
};

// @desc    Update hotel
// @route   PUT /api/v1/hotels/:id
// @access  Private (admin)
exports.updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!hotel) {
      return res.status(404).json({ success: false });
    }

    res.status(200).json({ success: true, data: hotel });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};

// @desc    Delete hotel
// @route   DELETE /api/v1/hotels/:id
// @access  Private (admin)
exports.deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `Hotel not found with id ${req.params.id}`
      });
    }


    await Booking.deleteMany({ hotel: req.params.id });

    await hotel.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};