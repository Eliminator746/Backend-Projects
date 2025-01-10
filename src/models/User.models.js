import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcypt from 'bcrypt';

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // cloudinary will provide this
      required: true,
    },
    coverImage: {
      type: String, // cloudinary will provide this
    },
    password: {
      type: String, // hashed password
      required: [true, 'Password is required'],
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// ------------------------------------------------------------------------------------------------------------------------
//                                                          BCRYPT-ENCRYPTED PASSWORD
// ------------------------------------------------------------------------------------------------------------------------

// HASH THE PASSWORD BEFORE SAVING
UserSchema.pre('save', async function (next) {
  // This check ensures only if password is modified, then only hash. Don't hash if other fields are modified like email, username etc.
  if (!this.isModified('password')) return next();

  this.password = await bcypt.hash(this.password, 10);
  next();
});

// Check if the password is correct
UserSchema.methods.isPasswordCorrect = async function (password) {
  return await bcypt.compare(password, this.password);
  // password is the password entered by user
  // this.password is the hashed password stored in DB
};


// ------------------------------------------------------------------------------------------------------------------------
//                                                          JWT TOKEN GENERATION
// ------------------------------------------------------------------------------------------------------------------------

UserSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,

    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.REFRESH_TOKEN_SECRET,

    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

// ------------------------------------------------------------------------------------------------------------------------

export const User = mongoose.model('User', UserSchema);
