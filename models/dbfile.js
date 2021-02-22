mongoose = require("mongoose");

const fileschema=new mongoose.Schema(
    {
        uuid:{type:String , required:true},
        uploadedfilename:{type:String,required:true},
        originalname:{type:String,required:true}
        ,path:{type:String,required:true}
        ,size:{type:String,required:true}
    },{timestamps:true}
)

File=mongoose.model('File',fileschema);
module.exports={File};