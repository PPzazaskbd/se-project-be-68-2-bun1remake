const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    user:{
        type : mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true
    },
    hotel:{
        type : mongoose.Schema.Types.ObjectId,
        ref:'Hotel',
        required: true
    },
    text:{
        type: String,
        default: 'Comment Placeholder'
    },
    rating:{
        type: Number,
        required: [true,'Please add rating'],
        min: 0,
        max: 5
    },
    createdAt: {
    type: Date,
    default: Date.now
    }
});

module.exports = mongoose.model('Comment',CommentSchema);