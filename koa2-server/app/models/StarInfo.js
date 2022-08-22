const { default: mongoose } = require('mongoose');

const starSchema = new mongoose.Schema({
    username:{
        type:String,
        required: true,
    },
    total:{
        type:Array,
        required: true,
    },
    folders:{
        type:Array,
        required:true,
    },
});

//参数为 模型名称 表的结构 表名
const starModel = mongoose.model('stars',starSchema,'stars');

module.exports = {
    starModel:starModel,
};