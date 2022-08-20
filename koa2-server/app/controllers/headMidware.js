const data = require('../../source/test/kdata.js');
const {getSubTemp} = require('../helpers/futuParam.js');
const {getKlByTypeAndCode} = require('../helpers/futuHelper.js');
const {checkStockCode} = require('../helpers/stockHelper');

//股票搜索
const search = async(ctx, next)=>{
    console.log('search '+ctx.request.body.code);
    const reqBody = ctx.request.body;
    let retObj = {
        state : false,
        code : null,
        msg: '',
    };
    const stockExist = checkStockCode(reqBody.code);
    if(stockExist === false){
        retObj.msg = '没有该股票信息！';
    }
    else{
        retObj.state = true;
        retObj.code = reqBody.code;
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
        //先订阅
        const subTemp = getSubTemp();
        subTemp.securityList.push({market:1,code:reqBody.code});
        subTemp.subTypeList=[6,10,11,12,13];
        subTemp.isSubOrUnSub = true;
        await ctx.quant.qotSub(subTemp);
        //再获取数据
        const klData = {
            minKl:await getKlByTypeAndCode(1,reqBody.code,ctx.quant),
            hourKl:await getKlByTypeAndCode(9,reqBody.code,ctx.quant),
            dayKl:await getKlByTypeAndCode(2,reqBody.code,ctx.quant),
            weekKl:await getKlByTypeAndCode(3,reqBody.code,ctx.quant),
            monthKl:await getKlByTypeAndCode(4,reqBody.code,ctx.quant),
        }
        retObj.data = {klData:klData};
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