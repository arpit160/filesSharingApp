express=require('express');
path=require('path');
multer=require('multer');
mongoose=require('mongoose')
session=require('express-session')
const flash = require('connect-flash');
bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Database Connection

const dburl=process.env.dburl 

mongoose.connect(dburl, {useNewUrlParser: true, useUnifiedTopology: true}).then(()=>
{console.log('connected to database successfully')})
.catch((e)=>{console.log(e)});

// file storage setup using multer

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname + '-' + Date.now() + path.extname(file.originalname))
    }
  })
   
var upload = multer({ storage: storage })

const{File}=require('./models/dbfile')

app=express();
app.use(session({secret:"thisisasecret",resave: false,saveUninitialized: true,
cookie: {
    maxAge: 24 * 60 * 60 * 1000
}}))
app.use(flash());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// setting views for templates
app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))
const fs = require('fs');

app.use((req,res,next)=> 
{
    res.locals.flasherror=req.flash('error') || null;    // this is a array
    res.locals.flashsuccess=req.flash('success') || null;
    next();
})

//deleting files after  24 hours
app.use(async(req,res,next)=> 
{
    files=await File.find({createdAt:{$lt:new Date(Date.now()-24*60*60*1000)}})
    for(i=0;i<files.length;i++)
    {
      file=files[i];
      fs.unlinkSync(file.path)
      await file.remove()
      await File.deleteOne({uuid:file.uuid});
    }
    next();
})
//setting routes
app.get('/file/upload',(req,res)=>
{
  res.render('upload')
})

app.post('/file/upload', upload.single('uploadfile'),async(req,res,next)=>
{
  //console.log(req.body)
if(!req.file)
{
   req.flash("error","file cannot be empty")
   return res.redirect('/file/upload') ;
}
else
{
    try
    {
    let uuid=uuidv4();
    file=new File({uuid,uploadedfilename:req.file.filename,path:req.file.path,size:req.file.size,originalname:req.file.originalname})
    await file.save()
    domainname=process.env.domainname
    downloadlink=`${domainname}file/download/${file.uuid}`;
    return res.json({link:downloadlink,uuid:uuid,size:req.file.size,name:req.file.originalname})
    }
    catch(e)
    {
      req.flash("error","Something went wrong")
      return res.redirect('/file/upload') ;
    }
}
})

app.get('/file/download/:uuid',async(req,res)=>
{
    console.log(req.params.uuid)
    file=await File.findOne({uuid:req.params.uuid});
    if(!file)
    {
      return res.render('download',{uuid:-1})
    }
    console.log(parseInt(file.size)/1000000)
    res.render('download',{uuid:req.params.uuid,name:file.originalname,size:file.size})
})

app.post('/file/download/:uuid',async (req,res)=>
{
    uuid=req.params.uuid;
    try{
    file=await File.findOne({uuid:uuid});
    if(!file)
    {
      req.flash("error","Your download link has expired")
      return res.redirect(`/file/download/${uuid}`)
    }
    console.log(file.path)
    res.download(file.path)
    }
    catch(e)
    {
      req.flash("error",'File with given link cannot be found')
      return res.redirect(`/file/download/${uuid}`)
    }
})

app.post('/send/:uuid',async(req,res,next)=>
{

  console.log(req.body)
  uuid=req.params.uuid;
  to=req.body.toemail;
  from=req.body.fromemail;
  console.log(from)
  console.log(to)
  if(!to || !from)
  {
    req.flash("error",'Both email fields are necessary,Please try once again');
    return res.redirect("/file/upload")
  }
  domainname=process.env.domainname 
  downloadlink=`${domainname}file/download/${uuid}`;
  let {sendEmail}=require('./nodemailer/mail')
  html=`<div style='text-align:center; width:50%;'><h3>Click the below button to download file</h3><br><button style='background-color:#219ebc;'><a style="text-decoration:none; color:white;" href=${downloadlink}>Click Here</button></div>`
  msg=''
  sendEmail(from,to,'File Sharing download link',msg,html)
  req.flash("success",'Email sent successfully');
  return res.redirect("/file/upload")
})

let port=process.env.port || 3000

app.listen(port,()=>
{
    console.log(`listening on ${port}`)
})