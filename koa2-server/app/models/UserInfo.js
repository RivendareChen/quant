const { default: mongoose } = require('mongoose');

//用户表
const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required: true,
    },
    password:{
        type:String,
        required: true,
    },
    usermail:{
        type:String,
        required:true,
    },
    level:{
        type:Number,
        required:true,
    }
});

//session表
const sessionSchema = new mongoose.Schema({
    username:{
        type:String,
        required: true
    },
    session:{
        type:String,
        required: true
    }
});

//参数为 模型名称 表的结构 表名
const userModel = mongoose.model('users',userSchema,'users');
const sessionModel = mongoose.model('sessions',sessionSchema,'sessions');


module.exports={
    userModel:userModel,
    sessionModel:sessionModel
};