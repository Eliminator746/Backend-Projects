import { Router } from 'express';
import { upload } from '../middleware/multer.middleware.js';
import { registerUser } from '../controller/user.controller.js';

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

export default router;
// We have used the upload.fields middleware to handle the file uploads.
// The registerUser function is the controller logic for registering a user. 
// The upload.fields middleware will save the uploaded files to the destination specified in the multer configuration.  
// The registerUser function will then process the uploaded files and save the user data to the database. 
// Finally, the route will send a response to the client with a success message.    