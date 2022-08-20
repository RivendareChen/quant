const {getKlTemp,getSubTemp}  = require('./futuParam.js');

//根据k线类型和股票代码获取k线数组 需要先订阅
//klType 分k=1 时k=9 日k=2 周k=3 月k=4
async function getKlByTypeAndCode(klType=1, code='00001', quant=null, reqNum=100) {
    if(!quant){
        console.log('丢失futu连接实例!');
        return;
    }
    const klTemp = getKlTemp();
    klTemp.klType = klType;
    klTemp.security = {market: 1,code:code};
    klTemp.reqNum = reqNum;
    let res = await quant.qotGetKL(klTemp);

    let retArray = [];
    res.forEach((item)=>{
        const retItem = [];
        // 日k 周k 月k 时间字段需要去除时分秒
        if(klType === 2 || klType === 3 || klType === 4){
            const time = item.time;
            item.time = time.split(' ')[0];
        }
        retItem.push(item.time);
        retItem.push(item.openPrice);
        retItem.push(item.closePrice);
        retItem.push(item.lowPrice);
        retItem.push(item.highPrice);
        retItem.push(parseInt(item.volume));
        retArray.push(retItem);
    });

    return retArray;
};

//根据股票代码获取基本信息(单只股票) 需要先订阅
async function getBasicByCode(securityList=getSubTemp().securityList, quant=null) {
    if(!quant){
        console.log('丢失futu连接实例!');
        return;
    }
    const retData = {
        price:{},
        trend:0,
    };
    //需要先订阅
    const res = await quant.qotGetBasicQot(securityList);
    let percent = (res[0].curPrice-res[0].lastClosePrice)/res[0].lastClosePrice;
    //保留三位有效数字
    percent = parseFloat(percent.toPrecision(3));
    retData.price = res[0];
    retData.trend = percent;

    return retData;
}

module.exports = {
    getKlByTypeAndCode:getKlByTypeAndCode,
    getBasicByCode:getBasicByCode,
};