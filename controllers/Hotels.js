const Hotel = require('../models/Hotel');
const Booking = require('../models/booking');
const hotelFilter = require('../utils/filter');
const Comment = require('../models/Comment');

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

  let remainingQueryStr = JSON.stringify(reqQuery);
  remainingQueryStr = remainingQueryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, m => `$${m}`);
  const baseQuery = { ...JSON.parse(remainingQueryStr), ...mongoQuery };

  const pipeline = [{ $match: baseQuery }];

  pipeline.push(
    { 
      $lookup: { 
        from: 'comments', 
        localField: '_id', 
        foreignField: 'hotel', 
        as: 'commentData' 
      } 
    },
    { 
      $addFields: { 
        review: { $avg: '$commentData.rating' },
        reviewCount: { $size: '$commentData' }
      } 
    },
    { $project: { commentData: 0 } }
  );

  if (req.query.review) {
    pipeline.push({ 
      $match: { averageRating: { $gte: Number(req.query.review) } } 
    });
  }

  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    const sortObj = {};
    sortBy.split(' ').forEach(f => {
      if (f.startsWith('-')) sortObj[f.substring(1)] = -1;
      else sortObj[f] = 1;
    });
    pipeline.push({ $sort: sortObj });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  try {
    let hotels = await Hotel.aggregate(pipeline);

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const total = hotels.length;

    const paginatedHotels = hotels.slice(startIndex, startIndex + limit);

    const pagination = {};
    if (startIndex + limit < total) pagination.next = { page: page + 1, limit };
    if (startIndex > 0) pagination.prev = { page: page - 1, limit };
    
    res.status(200).json({
      success: true,
      count: total,
      pagination,
      data: paginatedHotels
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
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
    await Comment.deleteMany({ hotel: req.params.id }); 
    

    await hotel.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false });
  }
};