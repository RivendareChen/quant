const data = require('../../source/test/kdata.js');
// const {nanoid} = require('nanoid'); 

//获取交易信息
const tradeInfo = async(ctx, next)=>{
    console.log('request tradeInfo');
    let retObj = {
        login: false,
        username:'',
        infos: [],
    };

    await next();

    if(ctx.authState.state === true){
        retObj.login = true;
        retObj.username = ctx.authState.username;
        retObj.infos.push(data.trade[0].info);
        retObj.infos.push(data.trade[1].info);
    }

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//获取交易详情
const tradeDetail = async(ctx, next)=>{
    console.log('request trade detail');
    const tradeId = ctx.request.body.name;

    let retObj = {
        login: false,
        username: 'unknown',
        info:{},
        details:[],
    }

    await next();

    if(ctx.authState.state === true){
        retObj.login = true;
        retObj.username = ctx.authState.username;
        if(tradeId === 's8cn05aKC4ISLhYGxIJ97'){
            retObj.info = data.trade[0].info;
            retObj.details = data.trade[0].details;
        }
        else if(tradeId === '9d4OT0KpHxgapX7rdYmkn'){
            retObj.info = data.trade[1].info;
            retObj.details = data.trade[1].details;
        }
        else{
            retObj.login = false;
        }
    }


    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

module.exports = {
    tradeInfo:tradeInfo,
    tradeDetail:tradeDetail,
};
