var express = require('express');
var app = express.Router();
const cors = require('cors');
const {User_dbConnect}=require('./database');
var session = require('express-session');
/* GET users listing. */
app.use(
  cors({
  origin: 'http://localhost:3000',
  // methods:["GET","POST","DELETE"],
})
)


//SESSION
const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
  secret: "Nosecret",
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false
}))


//Logout
app.get('/users-logout',(req,res)=>{
  session.User_ID=undefined
  res.send("success")
})


//Login authorization
app.get('/users-auth', (req, res) => {
  if (session.User_ID !== undefined) {
    res.send('success')
  } else {
    res.send('not login')
  }
})


app.post('/User_Data', (req, res) =>{
  console.log('hello')
  let{Name,Password,Email,Phone}= req.body;
  
  const insert=async()=>{
    const db=await User_dbConnect();

    const user = await db.findOne({Email: Email});
    if (user) {
      console.log("User already exists.")
      // return res.status(400).send({
      //   error: "User already exists. Please use another email."
      // });
      res.send("user exists")
      return;
    }
    session.User_ID=Email;
    const result=db.insertOne(
      {Name:Name,Email:Email,Password:Password,Phone:Phone}
    )
    session.User_ID= Email;
    res.send("sent")
  }
  insert();
 
});

// LOG IN

app.post('/LogReq', (req, res) =>{
  console.log('hello')
  let{Email,Password}= req.body;
  
  const login=async()=>{
    const db=await User_dbConnect();
    session.User_ID=Email;
    const user = await db.findOne({Email: Email,Password:Password});
    if (user) {
      console.log("Logged In")
      session.User_ID= Email;
      res.send("Logged")
      return;
    }else{

   res.send("not logged")
    }
   
  }
  login();

  
});

app.post('/Google_Data_signup',(req,res)=>{
  let{name,email}= req.body;
  console.log("user",email,name)
  const signup=async()=>{
    const db=await User_dbConnect();
    const user = await db.findOne({Email: email});
    if(!user){
      const insert=async()=>{
        const db=await User_dbConnect();
        db.insertOne(
          {Name:name,Email:email,LogMedium: "Google"}
        )
        session.User_ID=email;
        res.send("success")
        console.log("inserted id ok......")
      }
      insert();
    }
    else
    res.send("user exists")
  }
  signup();
})


app.post('/Google_Data_login',(req,res)=>{
  let{email}= req.body;
  // console.log("user",email)
  const login=async()=>{
    const db=await User_dbConnect();
    const user = await db.findOne({Email: email});
    if(user){
     session.User_ID=email;
     res.send("success")
    }
    else
    res.send("user not found")
  }
  login();
})




module.exports = app;