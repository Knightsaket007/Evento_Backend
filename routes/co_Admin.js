var express = require('express');
var app = express.Router();
const cors = require('cors');
const nodemailer = require('nodemailer');
const { Co_dbConnect } = require('./database');

// const cookie = `clickId=${id}; expires=${expirationDate.toUTCString()}; path=/`;
// document.cookie = cookie;
var session = require('express-session');
const cloudinary = require("cloudinary").v2;
const sharp = require("sharp");
cloudinary.config({
  cloud_name: 'dlkouz0a0',
  api_key: '693748518247382',
  api_secret: 'V7XCT7pVEJ_h4044LPBeAU9SfvM'
});


app.use(
  cors({
    origin: 'http://localhost:3000',
    // methods:["GET","POST","DELETE"],
  })
)

const fiveMinutes = 1000 * 60 * 5;

const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
  secret: "Nosecret",
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false
}))

//OTP

// let tempOtp = "";
let characters = "1234567890";
let length = characters.length;
function otpGenerator() {
  let newOtp = ""
  for (let i = 1; i <= 6; i++) {
    let index = Math.floor(Math.random() * length);
    newOtp += characters[index];
  }
  session.OTP_info = newOtp;
}


//Logout
app.get('/Co-admin-logout', (req, res) => {
  session.Co_User_ID = undefined
  res.send("success")
})

//Login authorization
app.get('/Co-admin-auth', (req, res) => {
  if (session.Co_User_ID !== undefined) {
    res.send('not login')
  } else {
    res.send('login')
  }
})


//Mail service
const transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "indian.guys2022@gmail.com",
    pass: "jdzzkcjstnpygppu"
  }
});


//Co-Admin_sIGNUP

app.post('/coadmin_varif', (req, res) => {
  console.log('hello')
  let { Email } = req.body;

  const verf = async () => {
    const db = await Co_dbConnect();
    const user = await db.Co_admin_Data.findOne({ Email: Email });
    if (user) {
      console.log("User already exists.")

      res.send("user exists")
      return;
    }
    if (session.OTP_info === undefined) {
      otpGenerator();
    }
    console.log("this is otp ", session.OTP_info)

    const options = {
      from: "indian.guys2022@gmail.com",
      to: Email,
      subject: "",
      text: "Your OTP is: " + session.OTP_info
    }
    setTimeout(() => {
      // Action to be executed after five minutes
      session.OTP_info = undefined;
      console.log("otp is terminated ", session.OTP_info);
    }, fiveMinutes);

    transport.sendMail(options, (err) => {
      if (err) {
        console.log(err);

      } else {
        // res.send('success')
      }
    });
    // // console.log("otp is ", genOtp)

    // const result=db.insertOne(
    //   {Name:Name,Email:Email,Password:Password,Phone:Phone}
    // )

    res.send("sent")
  }
  verf();

});



app.post('/Check-otp', (req, res) => {

  try {
    let { OTP, Name, Email, Password, Phone, Address } = req.body;

    const signed = async () => {

      const db = await Co_dbConnect();
      db.Co_admin_Data.insertOne(
        { Name: Name, Email: Email, Password: Password, Phone: Phone, Address: Address }
      )

    }

    if (OTP === session.OTP_info) {
      signed();
      res.send("user-inserted")
      session.OTP_info = undefined;

    } else {
      res.send("wrong-otp")
    }
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});


//Co-Admin_Login
app.post('/Log_coAdmin', (req, res) => {
  console.log('hello')
  let { Email, Password } = req.body;
  const login = async () => {
    const db = await Co_dbConnect();

    const user = await db.Co_admin_Data.findOne({ Email: Email, Password: Password });
    if (user) {
      console.log("Logged In")
      session.Co_User_ID = Email;
      console.log("user's Email address", session.Co_User_ID);
      res.send("Logged")
      return;
    }

    res.send("not logged")


  }

  login();
});


//EVENT DATA 

// app.post('/Event_Data', (req, res) => {
//   console.log(req.body)
//   console.log(req.file)
//   let { title, description, price, dateTime, seats, address } = req.body;
//   let file = req.files.imageObj
//   console.log("file " + file.name)
//   console.log("photo " + file.name)
//   let serverPath = 'public/images/' + file.name;
//   let databasePath = 'images/' + file.name;

//   file.mv(serverPath, error => {
//     if (error) throw error
//   })

//   const insertion = async () => {
//     try {
//       const db = await Co_dbConnect();
//       db.Co_EventData.insertOne({
//         Title: title,
//         Description: description,
//         Price: price,
//         dateandTime: dateTime,
//         seats: seats,
//         Address: address,
//         ImagePath: databasePath
//       });

//       res.status(200).send('File uploaded and data inserted successfully');
//     } catch (err) {
//       console.log(err);
//       res.status(500).send('Internal Server Error');
//     }
//   };

//   insertion();

// });



app.post("/Event_Data", async (req, res) => {
  try {
    let { title, description, price, datetime, seats, address } = req.body;
    let file = req.files.imageObj;
    console.log("dateTime :", datetime)
    console.log("seats :", seats)
    // Compress the image using sharp
    const compressedImageBuffer = await sharp(file.tempFilePath).jpeg({ quality: 60 }).toBuffer();
    // use .resize({ width: 1000 }) 

    // Upload the compressed image to Cloudinary
    let imagePath;
    await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: "image", folder: "Events_library" },
        (error, result) => {
          if (error) {
            console.error("Error uploading to Cloudinary:", error);
            reject(error);
          } else {
            console.log("Image uploaded to Cloudinary:", result);
            imagePath = result.secure_url; // Assign secure_url to imagePath
            resolve();
          }
        }
      ).end(compressedImageBuffer);
    });

    // const imagePath = result;
    console.log("imagePath", imagePath) 
    const insertion = async () => {

      const db = await Co_dbConnect();
      db.Co_EventData.insertOne({
        Title: title,
        Description: description,
        Price: price,
        dateandTime: datetime,
        seats: seats,
        Address: address,
        ImagePath: imagePath,
      });
    }
    insertion()


  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});


//Email info
const path = require('path');
const fs = require('fs');

app.get('/fetchEmail', (req, res) => {
  let Info = session.Co_User_ID;
  if (Info) {
    const fetch = async () => {
      try {
        const db = await Co_dbConnect();
        const data = await db.Co_admin_Data.findOne({ Email: Info }, { Name: 1, Address: 1, Phone: 1, ImagePath: 1 });
        console.log(data.Name);
        const imagePath = data.ImagePath;
        const absolutePath = path.join(__dirname, '..', 'public', imagePath);

        // Read the image file using fs.readFileSync
        const imageFile = fs.readFileSync(absolutePath);

        // Convert the image file to base64 encoding
        const base64Image = Buffer.from(imageFile).toString('base64');
        const extension = path.extname(imagePath).substring(1);
        res.send({ Email: Info, Name: data.Name, Address: data.Address, Phone: data.Phone, ImagePath: base64Image, Extension: extension });
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
    };
    fetch();
  }
})


app.post('/updateUser', (req, res) => {
  const { name, phone, address } = req.body;
  const update = async () => {
    try {
      const db = await Co_dbConnect();
      db.Co_admin_Data.updateOne({ Email: session.Co_User_ID }, { $set: { Name: name, Phone: phone, Address: address } })
      res.send('success')
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  }
  update();

})



app.post('/userActions', (req, res) => {

  let data = req.body
  console.log(data)
  let id = data[0].id;
  let clicks = data[0].clicks;
  const insertion = async () => {
    try {
      const db = await Co_dbConnect();
      const existingDocument = await db.Event_actions.findOne({ eventId: id });

      if (existingDocument) {
        // If a document with the given id exists, update the clicks value with the sum of the existing clicks and the new clicks
        const updatedClicks = existingDocument.clicks + clicks;
        await db.Event_actions.updateOne({ eventId: id }, { $set: { clicks: updatedClicks } });
      } else {
        // If no document with the given id exists, create a new one with the provided id and clicks
        await db.Event_actions.insertOne({ eventId: id, clicks: clicks });
      }
      res.status(200).send('ok');
    } catch (err) {
      console.log(err);
      res.status(500).send('Internal Server Error');
    }
  };

  insertion()
})


module.exports = app;