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
  review: {
    type: Number,
    default: null,
    min: [0, 'Review must be at least 0'],
    max: [5, 'Review cannot be more than 5'] 
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
  accommodationType:{//Hotel Resort
    type: String,
    required: [true, 'Please add a accommodation type']
  },
  specializations: {
    facility: { type: [String], default: [] }
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

HotelSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'hotelId',
  justOne: false
});

HotelSchema.statics.calculateAverageRating = async function(hotelId) {
    const stats = await mongoose.model('Comment').aggregate([
        { $match: { hotel: hotelId } }, 
        { $group: { _id: '$hotelId', averageRating: { $avg: '$rating' } } }
    ]);

    try {
        await this.findByIdAndUpdate(hotelId, {
            review: stats.length > 0 ? (Math.round(stats[0].averageRating * 10) / 10) : null
        });
    } catch (err) {
        console.error(err);
    }
};

module.exports = mongoose.model('Hotel', HotelSchema);
