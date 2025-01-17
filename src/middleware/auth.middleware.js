import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.models.js';

// ------------------------------------------------------------------------------------------------------------------------
//                                                          Verify JWT Logic
// ------------------------------------------------------------------------------------------------------------------------

// 1. Get token from cookies or headers
// 2. Verify token
// 3. Check if user exists 
// 4. Send user data via req.user

// ------------------------------------------------------------------------------------------------------------------------
export const verifyJWT= asyncHandler(async (req,_,next) => {
    
   try {
     // Step 1: Get token from cookies or headers
     const token = req.cookie?.accessToken || req.headers.authorization?.split(' ')[1];
     console.log('token', token);
     if(!token){
       throw new ApiError(401, 'Unauthorized');
     }
     // Step 2: Verify token
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // This will throw an error if token is invalid
     console.log('decodedToken', decodedToken);
 
     // Step 3: Check if user exists
     const user = await User.findById(decodedToken?._id).select('-password -refreshToken');
     if(!user){
       throw new ApiError(404, 'User not found');
     }
 
     // Step 4: Send user data via req.user
 
     req.user = user;
     next();

   } catch (error) {
     throw new ApiError(401, 'Unauthorized');
   }

});