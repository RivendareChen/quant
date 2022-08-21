const data = require('../../source/test/kdata.js');
const {getSubTemp} = require('../helpers/futuParam');
const {getBasicByCode,
       getKlParamByType,
       getSubParamByType,
       getKlByTypeAndCode} = require('../helpers/futuHelper');
const {checkStockCode} = require('../helpers/stockHelper');
const {kDataformat} = require('../helpers/macdHelper');
// const {nanoid} = require('nanoid'); 


//k线数据
const kdata = async(ctx, next)=>{
    const {code, type} = ctx.request.body;
    
    console.log('request kdata ', code, type);

    let retObj = {state:false,datas:{}};

    if(checkStockCode(code) !== false){
        //先订阅
        const subTemp = getSubTemp();
        subTemp.securityList = [{market:1,code:code}];
        subTemp.subTypeList = getSubParamByType('kl');
        subTemp.isSubOrUnSub = true;
        await ctx.quant.qotSub(subTemp);
        //获取k线数据
        const currKlDatas = await getKlByTypeAndCode(getKlParamByType(type),code,ctx.quant,100);
        retObj.state = true;
        // retObj.datas = currKlDatas;
        retObj.datas = kDataformat(currKlDatas);
    }else{
        console.log('非法k线请求');
    }
    
    await next();
    
    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//股票基本信息
const info = async(ctx, next)=>{
    const reqBody = ctx.request.body;
    console.log('request info', reqBody.code);
    const stockExist = checkStockCode(reqBody.code);
    let retObj = {};
    if(stockExist !== false){
        const subTemp = getSubTemp();
        subTemp.securityList=[{market: 1,code:reqBody.code}];
        subTemp.subTypeList = [1];
        subTemp.isSubOrUnSub = true;
        await ctx.quant.qotSub(subTemp);
        // console.log(reqBody.code, subTemp.securityList);
        const {price,trend} = await getBasicByCode(subTemp.securityList,ctx.quant);
        retObj = {
            code: reqBody.code,
            name: stockExist.name,
            en:stockExist.en,
            price: price.curPrice,
            trend: trend,
            low:price.lowPrice,
            high:price.highPrice,
            vol:Number(price.volume),
        }
    }

    

    await next();
    console.log(reqBody.code,retObj.trend);
    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//模拟摆盘数据
getHandlecapData = (code, price)=>{
    let buyArray = [];
    let saleArray = [];
    const myDate = new Date();
    for(let i=0; i<9; i++){
        //处理价格
        let float = Math.random();
        let buyPrice = (float+price).toFixed(2);
        float = Math.random()-0.5;
        let salePrice = (float+price).toFixed(2);

        //处理时间
        let hours = myDate.getHours();
        if(hours<10) hours = '0'+hours;
        let mins = myDate.getMinutes();
        if(mins<10) mins = '0'+mins;
        let secds = myDate.getSeconds();
        if(secds<10) secds = '0'+secds;
        let time = `${hours}:${mins}:${secds}`;

        //处理数量
        float = (Math.random()+0.01)*100;
        let buyQuantity = float.toFixed(0);
        float = (Math.random()+0.01)*100;
        let saleQuantity = float.toFixed(0);

        //封装对象至数组
        buyArray.push({
            time:time,
            price:buyPrice,
            quant:buyQuantity,
            type:'buy',
        });
        saleArray.push({
            time:time,
            price:salePrice,
            quant:saleQuantity,
            type:'sale',
        });
    }
    return {
        code: code,
        buyArray:buyArray,
        saleArray:saleArray
    }
}
//股票摆盘
const handicap = async(ctx, next)=>{
    const reqBody = ctx.request.body;
    // console.log('request handlecap', reqBody.code);
    const retObj = {code:'',buyArray:[],saleArray:[]};

    //先订阅
    const subTemp = getSubTemp();
    subTemp.securityList=[{market:1,code:reqBody.code}];
    subTemp.subTypeList = getSubParamByType('handicap');
    subTemp.isSubOrUnSub = true;
    await ctx.quant.qotSub(subTemp);

    const res = await ctx.quant.qotGetOrderBook({market:1,code:reqBody.code},9);
    retObj.code = reqBody.code;
    retObj.buyArray = res.buyList;
    retObj.saleArray = res.sellList;
    await next();

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
}

module.exports = {
    kdata:kdata,
    info:info,
    handicap:handicap,
};
