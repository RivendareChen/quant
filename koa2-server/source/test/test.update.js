console.log("Test FutuQuant...");

const fs = require('fs');
const path = require('path');

const FtQuant = require('../../../futu-quant/futuquant');

const ftConfig = require('../../../futu-quant/config').testFtConfig;
let subCase = require('./case.test').subCase;
let klCase = require('./case.test').klCase;
const {getSubParamByType} = require('../../app/helpers/futuHelper');

const testft = new FtQuant(ftConfig);


async function initConectTest() {
    let res = await testft.init();
    console.log(res);
}
async function getGlobalStateTest() {
    await testft.init();
    const res = await testft.getGlobalState();
    console.log(res);
}
async function qotGetSubInfoTest() {
    await testft.init();
    await testft.qotSub(subCase);
    let res = await testft.qotGetSubInfo(false);
    console.log(res);
    console.log(res.connSubInfoList[0].subInfoList[0].securityList);
}
async function subQotUpdateBasicQotTest() {
    await testft.init();
    subCase.isRegOrUnRegPush = true;
    await testft.qotSub(subCase);
    
    testft.subQotUpdateBasicQot((data)=>{
        console.log(data);
    });
}
async function subQotUpdateKLTest() {
    await testft.init();
    subCase.securityList = [{market:22, code:'002215'}]; //深圳股票市场 三全食品
    subCase.subTypeList = [11]; //1为基本价格 11为1分k线
    subCase.isRegOrUnRegPush = true; //注册推送
    await testft.qotSub(subCase);
    testft.subQotUpdateKL((data)=>{
        console.log(data);
    });
}
async function qotGetHistoryKLTest() {
    await testft.init();
    subCase.securityList = [{market:22, code:'002215'}];
    subCase.subTypeList = [6];
    await testft.qotSub(subCase);
    let params = {
        rehabType: 1,
        klType: 2,
        security: {market:22, code:'002215'},
        beginTime: '2022-02-10',
        endTime: '2022-02-27',
        maxAckKLNum:60,
    };

    try{
        let res = await testft.qotGetHistoryKL(params);
        console.log(res.length);
    }catch(err){
        console.log(err);
    }
    
}

async function getHandicapTest(){
    await testft.init();
    subCase.securityList=[{market: 1,code:'00001'}];
    subCase.subTypeList=getSubParamByType('handicap');
    await testft.qotSub(subCase);
    try{
        const res = await testft.qotGetOrderBook({market: 1,code:'00001'},9);
        console.log(res);
    }catch(err){
        console.log(err);
    }
    testft.close();
}
//klType 分k=1 时k=9 日k=2 周k=3 月k=4
async function qotGetKLTest(klType=1,code='00001') {
    klCase.klType = klType;
    klCase.security = {market: 1,code:code}
    let res = await testft.qotGetKL(klCase);

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
}

async function qotGetBasicQotTest() {
    const retArray = [];
    //需要先订阅
    const res = await testft.qotGetBasicQot(subCase.securityList);
    for(let i=0 ; i<3; i++){
        let percent = (res[i].curPrice-res[i].lastClosePrice)/res[i].lastClosePrice;
        //保留三位有效数字
        percent = parseFloat(percent.toPrecision(3));
        retArray.push({
            price: res[i].curPrice,
            trend: percent
        });
    }
    return retArray;
}

async function getkData() {
    //初始化
    await testft.init();
    //订阅
    await testft.qotSub(subCase);
    //karray1为二维数组 依次为 分 时 日 周 月
    //获取 00001 k线数据
    let karray1 = [];
    karray1.push(await qotGetKLTest(1,'00001'));
    karray1.push(await qotGetKLTest(9,'00001'));
    karray1.push(await qotGetKLTest(2,'00001'));
    karray1.push(await qotGetKLTest(3,'00001'));
    karray1.push(await qotGetKLTest(4,'00001'));
    //获取 00002 k线数据
    let karray2 = [];
    karray2.push(await qotGetKLTest(1,'00002'));
    karray2.push(await qotGetKLTest(9,'00002'));
    karray2.push(await qotGetKLTest(2,'00002'));
    karray2.push(await qotGetKLTest(3,'00002'));
    karray2.push(await qotGetKLTest(4,'00002'));
    //获取 00002 k线数据
    let karray3 = [];
    karray3.push(await qotGetKLTest(1,'00003'));
    karray3.push(await qotGetKLTest(9,'00003'));
    karray3.push(await qotGetKLTest(2,'00003'));
    karray3.push(await qotGetKLTest(3,'00003'));
    karray3.push(await qotGetKLTest(4,'00003'));

    //获取基本数据
    let bdata = await qotGetBasicQotTest();
    
    let retArray = {
        kdata: [karray1,karray2,karray3],
        bdata: bdata,
    }

    const retString = JSON.stringify(retArray);
    //Date的月日从0开始算
    const myDate = new Date();
    const fileName = 'data.'
                    +`${parseInt(myDate.getMonth())+1}`+'.'
                    +myDate.getDate()+'.'
                    +myDate.getHours()+'.'
                    +myDate.getMinutes()+'.js'
    //将数据写入文件
    // console.log(path.join(__dirname,'/data',fileName));
    fs.writeFileSync(path.join(__dirname,'/data',fileName), 
    'module.exports='+retString, 
    {
        flag:'w+'
    });
    
    testft.close();
}

//mongod --dbpath /usr/local/var/mongodb --logpath /usr/local/var/log/mongodb/mongo.log --fork

getGlobalStateTest();
// getHandicapTest();
// getkData();

