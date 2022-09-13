const data = require('../../source/test/kdata.js');
const {getSubTemp} = require('../helpers/futuParam.js');
const {getKlByTypeAndCode} = require('../helpers/futuHelper.js');
const {checkStockCode} = require('../helpers/stockHelper');
const stockData = require('../helpers/stockData');


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

//搜索联想
const searchInfo = async(ctx, next)=>{
    const reqBody = ctx.request.body;
    const retObj = {
        state: false,
        type: 'null',
        option:null,
    };
    if(reqBody.content === ''){
        retObj.state = true;
        retObj.type = 'suggest';
        retObj.option = [
            {code:'00001', "name":"长和", "en":"CKH HOLDINGS"},
            {code:'00002', "name":"中电控股","en":"CLP HOLDINGS"},
            {code:'00003', "name":"香港中华煤气","en":"HK & CHINA GAS"},
            {code:'00004', "name":"九龙仓集团","en":"WHARF HOLDINGS"},
            {code:'00005', "name":"汇丰控股","en":"HSBC HOLDINGS"},
            {code:'00006', "name":"电能实业","en":"POWER ASSETS"},
        ];
    }
    else{
        const option = [];
        for(let key in stockData){
            if(option.length>=5)break;
            const ifKey = key.split(reqBody.content).length>1;
            const ifName = stockData[key].name.split(reqBody.content).length>1;
            const ifEn = stockData[key].en.split(reqBody.content).length>1
            if(ifKey || ifName || ifEn){
                option.push({
                    code:key,
                    name:stockData[key].name,
                    en:stockData[key].en
                });
            }
        }

        if(option.length>0){
            retObj.state = true;
            retObj.type = 'association';
            retObj.option = option;
        }
        else{
            retObj.state = true;
            retObj.type = 'suggest';
            retObj.option = [
                {code:'00001', "name":"长和", "en":"CKH HOLDINGS"},
                {code:'00002', "name":"中电控股","en":"CLP HOLDINGS"},
                {code:'00003', "name":"香港中华煤气","en":"HK & CHINA GAS"},
                {code:'00004', "name":"九龙仓集团","en":"WHARF HOLDINGS"},
                {code:'00005', "name":"汇丰控股","en":"HSBC HOLDINGS"},
                {code:'00006', "name":"电能实业","en":"POWER ASSETS"},
            ];
        }
    }

    await next();

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
}



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

    if(ctx.authState.state === true && checkStockCode(reqBody.code)!==false){
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
    searchInfo:searchInfo,
};