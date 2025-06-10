import mongoose from 'mongoose';

const contributionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chama: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chama',
    required: true
  },
  cycle: {
    type: Number,
    required: true,
    min: 1
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  mpesaCode: {
    type: String,
    default: null
  },
  checkoutRequestId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  phoneNumber: {
    type: String,
    required: true,
    match: [/^254\d{9}$/, 'Please enter a valid Kenyan phone number']
  },
  transactionDate: {
    type: Date,
    default: null
  },
  failureReason: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound index to ensure one contribution per user per cycle per chama
contributionSchema.index({ user: 1, chama: 1, cycle: 1 }, { unique: true });

export default mongoose.model('Contribution', contributionSchema);