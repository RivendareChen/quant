// const data = require('../../source/test/kdata.js');
// const {nanoid} = require('nanoid'); 

//初始化收藏夹
const initstar = async(ctx, next)=>{
    console.log('init star '+ctx.authState.username);
    let retObj = {
        total:{
            name:'全部股票',
            children:[],
        },
        folders:[],
    };
    if(ctx.authState.state === true){
        retObj = {
            total:{
                name:'全部股票',
                children:['00001','00002','00003'],
            },
            folders:[
                {name:'自定文件夹1', children:['00002', '00003']},
                {name:'自定文件夹2', children:['00001','00002','00003']},
            ]
        };
    }
    
    await next();

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//股票收藏or取消收藏
const star = async(ctx, next)=>{
    //仅发送收藏股票的代码 忽略收藏或者取消收藏
    //当用户第一次收藏该股票时 在数据库用户收藏表中加入该股票并设置为true
    //当该股票已存在收藏表中时，直接取反
    const reqBody = ctx.request.body;
    console.log('star '+reqBody.code);
    let retObj = {
        success: false,
        state: false,
    }

    await next();

    retObj.state = ctx.authState.state;
    retObj.success = true;

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//新建股票收藏夹
const createfolder = async(ctx, next)=>{
    const reqBody = ctx.request.body;
    console.log(`add folder ${reqBody.name} to ${ctx.authState.username}`);

    let retObj = {
        success: false,
        msg: '服务器错误'
    }

    await next();

    if(ctx.authState.state === true){
        retObj = {
            success:true,
        }
    }
    else{
        retObj.msg = '用户未登录';
    }

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//删除股票收藏夹
const removefolder = async(ctx, next)=>{
    const reqBody = ctx.request.body;
    console.log(`remove folder ${reqBody.name} from ${ctx.authState.username}`);
    
    let retObj = {
        success: false,
        msg: '服务器错误'
    }

    await next();

    if(ctx.authState.state === true){
        retObj = {
            success:true,
        }
    }
    else{
        retObj.msg = '用户未登录';
    }

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//从收藏夹移除股票
const removestar = async(ctx, next)=>{
    const {folder, code} = ctx.request.body;
    console.log(`remove ${code} from ${folder}`);
    
    let retObj = {
        success: false,
        msg: '服务器错误'
    }

    await next();

    if(ctx.authState.state === true){
        retObj = {
            success:true,
        }
    }
    else{
        retObj.msg = '用户未登录';
    }

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//将股票加入收藏夹
const addstar = async(ctx, next)=>{
    const {folder, code} = ctx.request.body;
    console.log(`add ${code} to ${folder}`);
    
    let retObj = {
        success: false,
        msg: '服务器错误'
    }

    await next();

    if(ctx.authState.state === true){
        retObj = {
            success:true,
        }
    }
    else{
        retObj.msg = '用户未登录';
    }

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

module.exports = {
    initstar:initstar,
    star:star,
    createfolder:createfolder,
    removefolder:removefolder,
    removestar:removestar,
    addstar:addstar,
};