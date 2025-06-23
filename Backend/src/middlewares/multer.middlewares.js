import multer from "multer"; //multer is used to make a middleware here as we are first uploading our files to a local server and then to main server through cloudinary

const storage = multer.diskStorage({
  destination: function (req, file, cb) { //here we get a file option in middle, so it works as middleware and cb is basically the call back function
    cb(null, './public/temp') //here local temporary storage where you are going to keep your file is given as a parameter
  },
  filename: function (req, file, cb) { //We can keep unique file names also by using const like uniqueSuffix given below to generate unique names
    // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    // cb(null, file.fieldname + '-' + uniqueSuffix)
    //add lateron unique filenames as they get them for very short period of time untill they send to main server through cloudinary

    cb(null, file.originalname) //we are going to keep original filename given by user here

  }
})

export const upload = multer({
    storage
});


//now we can use these while writing routes for eg:- 
//app.post('/profile', upload.single('avatar'), function(req, res, next)){} where upload.single('avatar') act as middleware and upload is defined using multer like storage above