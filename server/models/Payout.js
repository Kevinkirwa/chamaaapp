import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  chama: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chama',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
    enum: ['pending', 'processing', 'completed', 'failed'],
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

export default mongoose.model('Payout', payoutSchema);