import { Router } from 'express';
import { upload } from '../middleware/multer.middleware.js';
import { registerUser, loginUser, logoutUser, refreshAccessToken } from '../controller/user.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();


router.route('/register').post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    },
  ]),

  registerUser
);

router.route('/login').post(loginUser);
router.route('/logout').post(verifyJWT,logoutUser);

// Frontend uses this endpoint to redirect if access token is expired
router.route("/refresh-token").post(refreshAccessToken)

export default router;
// We have used the upload.fields middleware to handle the file uploads.
// The registerUser function is the controller logic for registering a user. 
// The upload.fields middleware will save the uploaded files to the destination specified in the multer configuration.  
// The registerUser function will then process the uploaded files and save the user data to the database. 
// Finally, the route will send a response to the client with a success message.    