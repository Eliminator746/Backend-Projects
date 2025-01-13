import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/User.models.js';

// ------------------------------------------------------------------------------------------------------------------------
//                                                          LOGIC
// ------------------------------------------------------------------------------------------------------------------------

// 1. Get user data from frontedn , request body
// 2. validation : input should be of correct data type + not empty
// 3. check if user already exists
// 4. Check for images, avatar (as it is req. field)
// 5. Upload them to cloudinary, get url, check for avatar again
// 6. create user obj. i.e store in db
// 7. remove password and refresh token from response
// 8. Check for user creation
// 9. Send response to frontend

// ------------------------------------------------------------------------------------------------------------------------

const registerUser = asyncHandler(async (req, res) => {
  // 1. Get user data from frontedn , request body
  const { username, email, fullName, password } = req.body;

  // 2. Validation
  // if (!username || !email || !fullName || !password) {
  //   return res.status(400).json({ success: false, message: 'Please fill all fields' });
  // }

  if (
    [username, email, fullName, password].some((field) => field.trim() === '')
  ) {
    return res
      .status(400)
      .json({ success: false, message: 'Please fill all fields' });
  }

  // zod

  // 3. Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    return res
      .status(400)
      .json({ success: false, message: 'User already exists' });
  }

  // 4. Check for images, avatar (as it is req. field)
  // Before checking this, we need to configure routes

  console.log(req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    return res
      .status(400)
      .json({ success: false, message: 'Please upload avatar image' });
  }

  // 5. Upload them to cloudinary, get url, check for avatar again

  const avatarURL = await uploadToCloudinary(avatarLocalPath);
  const coverImageURL = await uploadOnCloudinary(coverImageLocalPath);
  //uploadtocloudinary should ideally upload the image to cloudinary and by any chance if it fails, we should handle it. since it is issue from our side, we should return 500 status code
  if (!avatarURL) {
    return res
      .status(500)
      .json({ success: false, message: 'Failed to upload avatar image' });
  }

  // 6. create user obj. i.e store in db
  const user = await User.create({
    username,
    email,
    fullName,
    password,
    avatar: avatarURL.secure_url,
    coverImage: coverImageURL?.secure_url || '',
  });

  // 7-8. Check for user creation + remove password and refresh token from response
  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  // 9. Send response to frontend
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    createdUser,
  });
});
