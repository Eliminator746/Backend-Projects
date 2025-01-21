import asyncHandler from '../utils/asyncHandler.js';
import { User } from '../models/User.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiError} from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken"

// ------------------------------------------------------------------------------------------------------------------------
//                                                       Register User LOGIC
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
    [username, email, fullName, password].some((field) => field?.trim() === '')
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

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  console.log('avatarLocalPath', avatarLocalPath);

  if (!avatarLocalPath) {
    return res
      .status(400)
      .json({ success: false, message: 'Please upload avatar image' });
  }

  // 5. Upload them to cloudinary, get url, check for avatar again

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  console.log('avatar', avatar);

  //uploadtocloudinary should ideally upload the image to cloudinary and by any chance if it fails, we should handle it. since it is issue from our side, we should return 500 status code
  if (!avatar) {
    console.error('Avatar upload failed:', avatar);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to upload avatar image' });
  }

  if (!coverImage) {
    console.error('Cover image upload failed:', coverImage);
    return res
      .status(500)
      .json({ success: false, message: 'Failed to upload cover image' });
  }

  // 6. create user obj. i.e store in db
  const user = await User.create({
    username,
    email,
    fullName,
    password,
    avatar: avatar.secure_url,
    coverImage: coverImage?.secure_url || '',
  });

  // 7-8. Check for user creation + remove password and refresh token from response
  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  // 9. Send response to frontend
  if (!createdUser)
    return res
      .status(500)
      .json({ success: false, message: 'Failed to create user' });

  res.status(201).json({
    success: true,
    createdUser,
    message: 'User registered successfully',
  });
});

// ------------------------------------------------------------------------------------------------------------------------
//                                                       Login User LOGIC
// ------------------------------------------------------------------------------------------------------------------------

// 1. Get user data from frontedn , request body
// 2. username or email
// 3. find user
// 4. Generate access and refresh token and update user with refresh token
// 5. Send cookies to frontend

// ------------------------------------------------------------------------------------------------------------------------
const loginUser = asyncHandler(async (req, res) => { 

  // Step 1 : Extract details from request body
  const {email, username, password} = req.body;
  if(!email || !username || !password){
    throw new ApiError(400, 'Please fill the required details')
  }

  // Step 2: Find user
  const user= await User.findOne({
    $or : [{email} , {username}]
  })

  if(!user){
    return ApiError(400, 'User not found')
  }

  // Validate password
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
      throw new ApiError(400, 'Invalid password')
    }

  // Step 3: Generate access and refresh token and update user with refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id);

  // Step 4: Send cookies to frontend
    const options={
      httpOnly: true,
      secure: true
    }
  // I don't want to send password and refresh token to user
    const loggedInUser = await User.findById(user._id).select('-password -refreshToken');

    return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken,options)
    .json(
      new ApiResponse(200, {user: loggedInUser, accessToken, refreshToken}, 'User logged in successfully')
    )
});


async function generateAccessAndRefereshTokens(userId){
  try {
    const user= await User.findById(userId);
  
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
  
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false}); // we are not validating before saving because we are not updating any field. IMP Step
  
    return {accessToken, refreshToken}
  } catch (error) {
    throw new ApiError(500, 'Failed to generate tokens')
  }
}

// ------------------------------------------------------------------------------------------------------------------------
//                                                       Logout User LOGIC
// ------------------------------------------------------------------------------------------------------------------------

// 1. Get userId from req.user and update refresh token to null
// 2. Clear cookies
// 3. Send response

// ------------------------------------------------------------------------------------------------------------------------
const logoutUser = asyncHandler(async (req, res) => {
  
  // Step 1: Get userId from req.user and update refresh token to null
  console.log('req.user', req.user);
  await User.findByIdAndUpdate(req.user._id, {refreshToken: null},{new: true});

  // Step 2: Clear cookies
  const options={
    httpOnly: true,
    secure: true,
  }

  // Step 3: Send response
  res.status(200)
  .clearCookie('accessToken', options)
  .clearCookie('refreshToken', options)
  .json(new ApiResponse(200, 'User logged out successfully'))

});

// ------------------------------------------------------------------------------------------------------------------------
//                                                       Renew token after it's expiry LOGIC
// ------------------------------------------------------------------------------------------------------------------------

// 1. Fetch refresh token from frontend i.e cookie
// 2. Get user
// 3. Check refresh token of frontend and backend same or not
// 4. Generate access token 
// 5. Send response

// ------------------------------------------------------------------------------------------------------------------------
const refreshAccessToken= asyncHandler(async (req,res) => {

  // 1. Fetch refresh token from frontend i.e cookie
    const incomingRefreshToken = req.cookie?.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
      throw new ApiError(401, "Refresh Token expired")
    }

  try {
  // 2. Get user
      const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
      if(!decodedToken){
        throw new ApiError(401, "Invalid Token")
      }
    
      const user = await User.findById(decodedToken?._id)
      if(!user){
        throw new ApiError(401, "Invalid refresh token")
      }
    
  // 3. Check refresh token of frontend and backend same or not
      if(incomingRefreshToken !== user?.refreshToken)
        throw new ApiError(401, "Refresh token is expired or used")
    
  // 4. Generate access token 
      cosnt {accessToken,newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
      const options = {
        httpOnly: true,
        secure: true
      }
    
  // 5. Send response
      return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken: newRefreshToken, options)
        .json(
          new ApiResponse(
              200, 
              {accessToken, refreshToken: newRefreshToken},
              "Access token refreshed"
          )
      )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }

});

// ------------------------------------------------------------------------------------------------------------------------
//                                                       Update Password 
// ------------------------------------------------------------------------------------------------------------------------

  // User is in logged in State. So user info you can get from middleware only
  // 1. Get old password, new Password from user
  // 2. Verify if it is correct [User password vs saved password in db]
  // 3. Update it with new password

// ------------------------------------------------------------------------------------------------------------------------
const changeCurrentPassword= asyncHandler(async (req,res) => {

  // 1. Get old password, new Password from user
    const {oldPassword, newPassword}= req.body;

  // 2. Verify if it is correct [User password vs saved password in db]
    const user= await User.findById(req.user?._id);
    const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect)
      throw new ApiError(400, "Invalid old password")

  // 3. Update it with new password
    // await User.findByIdAndUpdate( req.user._id ,{$set : {password : newPassword}},{new:true})
    // We are hashing the password, so save used.
    user.password=newPassword
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json( new ApiResponse(200,{},"Password updated successfully"))

});

// ------------------------------------------------------------------------------------------------------------------------
//                                                       Get Current User
// ------------------------------------------------------------------------------------------------------------------------
  
  // req.user

// ------------------------------------------------------------------------------------------------------------------------
const getCurrentUser = asyncHandler(async(req,res) => {
    return res.status(200).json(new ApiResponse(200, req.user ,"Current user fetched"))
});

// ------------------------------------------------------------------------------------------------------------------------
//                                                       Update Account Details
// ------------------------------------------------------------------------------------------------------------------------

  // Updating FullName and Email only
  // 1. Get new fullName and Email from user
  // 2. Update it

// ------------------------------------------------------------------------------------------------------------------------
const updateAccountDetails = asyncHandler(async (req,res) => {

  // 1. Get new fullName and Email from user
    const {fullName,email} = req.body;

    if (!fullName || !email) {
      throw new ApiError(400, "All fields are required")
  }

  // 2. Update it
    const user= await User.findByIdAndUpdate(req.user?._id, 
      {
        $set : {fullName,email} 
      },
      {
        new : true
      }).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))

});

// ------------------------------------------------------------------------------------------------------------------------
//                                                       Update User Avatar
// ------------------------------------------------------------------------------------------------------------------------

  // 1. Get file path using multer, which user uploaded
  // 2. Upload on cloudinary
  // 3. Update avatar url with url you get via cloudinary in step 2
  
// ------------------------------------------------------------------------------------------------------------------------
const updateUserAvatar = asyncHandler(async (req,res) => {

    const avatarLocalPath= req.file?.path;
    if (!avatarLocalPath)
      throw new ApiError(400, "Avatar file is missing")
    

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.secure_url) {
      throw new ApiError(400, "Error while uploading on avatar") 
    }

    const user= await User.findByIdAndUpdate(req.user?._id, {$set : {avatar : avatar.secure_url}}, {new:true}).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )

});

// ------------------------------------------------------------------------------------------------------------------------
//                                                         Update CoverImage
// ------------------------------------------------------------------------------------------------------------------------
const updateCoverImage = asyncHandler(async (req,res) => {
  const coverImageLocalPath= req.file?.path;
    if (!coverImageLocalPath)
      throw new ApiError(400, "Avatar file is missing")
    

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.secure_url) {
      throw new ApiError(400, "Error while uploading on avatar") 
    }

    const user= await User.findByIdAndUpdate(req.user?._id, {$set : {coverImage : coverImage.secure_url}}, {new:true}).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image updated successfully")
    )
});


export { 
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateCoverImage,
};
