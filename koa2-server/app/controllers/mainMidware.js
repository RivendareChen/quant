const data = require('../../source/test/kdata.js');
const {getSubTemp} = require('../helpers/futuParam');
const {getBasicByCode,
       getKlParamByType,
       getSubParamByType,
       getKlByTypeAndCode,
       getHKMarketStateCode,
      } = require('../helpers/futuHelper');
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
        const marketState = await getHKMarketStateCode(ctx.quant);
        const {price,trend} = await getBasicByCode(subTemp.securityList,ctx.quant);
        retObj = {
            code: reqBody.code,
            name: stockExist.name,
            en:stockExist.en,
            price: price.curPrice,
            trend: trend,
            marketState:marketState,
            low:price.lowPrice,
            high:price.highPrice,
            vol:Number(price.volume),
        }
    }

    await next();
    // console.log(reqBody.code,retObj.trend);
    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};


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
