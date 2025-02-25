// M-2 [preferred way]
const asyncHandler = (requestHandler) => (req, res, next) => {
  return Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
};

export default asyncHandler;




// M-1
// const asyncHandler = fn => async (req,res,next) =>{

//     try {
//         await fn(req,res,next);
//     } catch (error) {
//         res.status( error.code || 500).json({
//             success : false,
//             message:error.message
//         })
//     }
// }
