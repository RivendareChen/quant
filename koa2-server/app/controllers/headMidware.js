const data = require('../../source/test/kdata.js');
// const {nanoid} = require('nanoid'); 

//股票搜索
const search = async(ctx, next)=>{
    console.log('search '+ctx.request.body.code);
    const reqBody = ctx.request.body;
    let retObj = {
        state : false,
        code : null,
        msg: '',
    };

    if(reqBody.code === '00001'|| reqBody.code === '00002'|| reqBody.code === '00003'){
        retObj.state = true;
        retObj.code = reqBody.code;
    }
    else{
        retObj.msg = '没有该股票信息！';
    }
    
    await next();

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//盘后数据下载
const download = async(ctx,next)=>{
    const reqBody = ctx.request.body;
    console.log('request download ', reqBody.code);
    let retObj = {
        state:false,
        msg:'未知错误',
        data:{},
    }

    await next();

    if(ctx.authState.state === true){
        retObj.state = true;
        retObj.msg='';
        retObj.data = data.kdata[0];
    }
    else{
        retObj.msg="请登录后下载盘后数据";
    }

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

module.exports = {
    search:search,
    download:download,
};