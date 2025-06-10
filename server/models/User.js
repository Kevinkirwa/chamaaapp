import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^254\d{9}$/, 'Please enter a valid Kenyan phone number (254XXXXXXXXX)']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['member', 'chama_creator', 'admin', 'super_admin'],
    default: 'member'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  canCreateChamas: {
    type: Boolean,
    default: false
  },
  // Track user's total savings across all Chamas
  totalSavings: {
    type: Number,
    default: 0
  },
  // Track user's total received payouts
  totalReceived: {
    type: Number,
    default: 0
  },
  // Enhanced verification details with document upload
  verificationRequest: {
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    requestedAt: {
      type: Date,
      default: null
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: null
    },
    // Kenya National ID verification
    nationalId: {
      idNumber: {
        type: String,
        default: null,
        match: [/^\d{8}$/, 'Please enter a valid 8-digit Kenya National ID number']
      },
      fullName: {
        type: String,
        default: null,
        trim: true
      },
      dateOfBirth: {
        type: Date,
        default: null
      },
      placeOfBirth: {
        type: String,
        default: null,
        trim: true
      }
    },
    // Document uploads (stored as base64 or file paths)
    documents: {
      idFrontPhoto: {
        type: String, // Base64 encoded image or file path
        default: null
      },
      idBackPhoto: {
        type: String, // Base64 encoded image or file path
        default: null
      },
      selfiePhoto: {
        type: String, // Base64 encoded image or file path
        default: null
      },
      uploadedAt: {
        type: Date,
        default: null
      }
    },
    // Phone number verification
    phoneVerification: {
      isPhoneRegisteredWithId: {
        type: Boolean,
        default: false
      },
      phoneOwnerName: {
        type: String,
        default: null,
        trim: true
      },
      verificationMethod: {
        type: String,
        enum: ['manual_check', 'api_verification', 'document_review'],
        default: 'document_review'
      }
    },
    // Admin review notes
    adminNotes: {
      type: String,
      default: null,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
    },
    // Risk assessment
    riskAssessment: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      factors: [{
        factor: String,
        score: Number,
        description: String
      }],
      assessedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      assessedAt: {
        type: Date,
        default: null
      }
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user can create Chamas
userSchema.methods.canCreateChama = function() {
  return this.canCreateChamas || 
         ['chama_creator', 'admin', 'super_admin'].includes(this.role);
};

// Validate ID documents completeness
userSchema.methods.hasCompleteDocuments = function() {
  const docs = this.verificationRequest.documents;
  return docs.idFrontPhoto && docs.idBackPhoto && docs.selfiePhoto;
};

// Calculate verification completeness percentage
userSchema.methods.getVerificationProgress = function() {
  let progress = 0;
  const verification = this.verificationRequest;
  
  // Basic info (20%)
  if (verification.nationalId.idNumber) progress += 20;
  
  // Documents (60% - 20% each)
  if (verification.documents.idFrontPhoto) progress += 20;
  if (verification.documents.idBackPhoto) progress += 20;
  if (verification.documents.selfiePhoto) progress += 20;
  
  // Phone verification (20%)
  if (verification.phoneVerification.isPhoneRegisteredWithId) progress += 20;
  
  return progress;
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.model('User', userSchema);