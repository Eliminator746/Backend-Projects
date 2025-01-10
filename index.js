import dotenv from 'dotenv';
import connectDB from './src/db/index.js';


dotenv.config({
  path: './.env',
});

connectDB()
  .then(() => {
    app.on('error', (err) => {
      console.error('Error: ' + err);
      throw err;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
  })
  .catch((err) => {
    console.error('Error: ' + err);
    throw err;
  });

  

// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

//     app.on('error', (err) => {
//       console.error('Error : ' + err);
//       throw err;
//     });
//     app.listen(process.env.PORT, () => {
//       console.log(`Server is running on port ${process.env.PORT}`);
//     });

//   } catch (err) {
//     console.error('Error : ' + err);
//     throw err;
//   }
// })();
