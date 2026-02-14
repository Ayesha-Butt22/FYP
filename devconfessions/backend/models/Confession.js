import mongoose from 'mongoose';

const confessionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Confession text is required'],
    maxlength: [500, 'Confession cannot exceed 500 characters'],
    trim: true
  },
  tags: {
    type: [String],
    validate: {
      validator: function(v) {
        return v.length <= 3;
      },
      message: 'Maximum 3 tags allowed'
    }
  },
  likes: {
    type: Number,
    default: 0
  },
  likedIPs: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['active', 'removed'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for efficient querying
confessionSchema.index({ createdAt: -1 });
confessionSchema.index({ tags: 1 });
confessionSchema.index({ likes: -1 });

const Confession = mongoose.model('Confession', confessionSchema);

export default Confession;
