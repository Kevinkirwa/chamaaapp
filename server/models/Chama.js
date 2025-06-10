import mongoose from 'mongoose';

const chamaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Chama name is required'],
    trim: true,
    maxlength: [100, 'Chama name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  contributionAmount: {
    type: Number,
    required: [true, 'Contribution amount is required'],
    min: [100, 'Minimum contribution is KSh 100'],
    max: [1000000, 'Maximum contribution is KSh 1,000,000']
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    length: 6
  },
  currentCycle: {
    type: Number,
    default: 1,
    min: 1
  },
  currentReceiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    payoutOrder: {
      type: Number,
      required: true,
      min: 1
    },
    hasReceived: {
      type: Boolean,
      default: false
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    // Track member's contribution history
    totalContributed: {
      type: Number,
      default: 0
    },
    // Track if member has received payout in current cycle
    receivedInCurrentCycle: {
      type: Boolean,
      default: false
    }
  }],
  cycleStartDate: {
    type: Date,
    default: Date.now
  },
  nextPayoutDate: {
    type: Date,
    default: null
  },
  // Track total amount collected in current cycle
  currentCycleAmount: {
    type: Number,
    default: 0
  },
  // Track completed cycles
  completedCycles: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate unique invite code
chamaSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// Calculate next payout date (monthly)
chamaSchema.methods.calculateNextPayoutDate = function() {
  const nextDate = new Date(this.cycleStartDate);
  nextDate.setMonth(nextDate.getMonth() + this.currentCycle);
  return nextDate;
};

// Get current receiver based on payout order
chamaSchema.methods.getCurrentReceiver = function() {
  return this.members.find(member => 
    member.payoutOrder === this.currentCycle && !member.hasReceived
  );
};

// Check if all members have contributed for current cycle
chamaSchema.methods.isCurrentCycleComplete = async function() {
  const Contribution = mongoose.model('Contribution');
  const completedContributions = await Contribution.countDocuments({
    chama: this._id,
    cycle: this.currentCycle,
    status: 'completed'
  });
  return completedContributions === this.members.length;
};

// Move to next cycle
chamaSchema.methods.moveToNextCycle = function() {
  // Mark current receiver as received
  const currentReceiver = this.getCurrentReceiver();
  if (currentReceiver) {
    currentReceiver.hasReceived = true;
    currentReceiver.receivedInCurrentCycle = true;
  }

  // Check if all members have received (complete round)
  const allReceived = this.members.every(member => member.hasReceived);
  
  if (allReceived) {
    // Reset for new round
    this.members.forEach(member => {
      member.hasReceived = false;
      member.receivedInCurrentCycle = false;
    });
    this.completedCycles += 1;
  }

  // Move to next cycle
  this.currentCycle += 1;
  this.currentCycleAmount = 0;
  this.cycleStartDate = new Date();
  
  // Set next receiver
  const nextReceiver = this.getCurrentReceiver();
  this.currentReceiver = nextReceiver ? nextReceiver.user : null;
};

export default mongoose.model('Chama', chamaSchema);