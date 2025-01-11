import { Router } from 'express';


const router=Router();

router.route('./register').post((req,res)=>{
    res.send('User registered successfully')
})
router.route('./register').post(registerUser);


export default router;