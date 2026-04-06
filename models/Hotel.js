const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name can not be more than 50 characters']
  },
  description: {
    type: String,
    default: 'default',
    trim: true,
    maxlength: [500, 'Description can not be more than 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    default: 67,
    min: [0, 'Price must be at least 0']
  },
  imgSrc: {
    type: String,
    default: 'default',
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  district: {
    type: String,
    required: [true, 'Please add a district']
  },
  province: {
    type: String,
    required: [true, 'Please add a province']
  },
  postalcode: {
    type: String,
    required: [true, 'Please add a postal code'],
    maxlength: [5, 'Postal code can not be more than 5 characters']
  },
  tel: {
    type: String
  },
  region: {
    type: String,
    required: [true, 'Please add a region']
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


HotelSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',      
  foreignField: 'hotel',
  justOne: false
});

module.exports = mongoose.model('Hotel', HotelSchema);
