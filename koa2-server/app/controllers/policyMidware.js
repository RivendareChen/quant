// const data = require('../../source/test/kdata.js');
const {nanoid} = require('nanoid'); 
const {checkStockCode} = require('../helpers/stockHelper');

//策略初始化
const initpolicy = async(ctx, next)=>{

    let retObj = {
        state: false,
        username: null,
        myPolicy:[],
    }


    await next();

    retObj.state = ctx.authState.state;
    retObj.username = ctx.authState.username;

    //     id:'',
    //     total:0,
    //     time:{start:'',end:''},
    //     state: {code:0,msg:'正在执行'},

    retObj.myPolicy.push({
        id:'s8cn05aKC4ISLhYGxIJ97',
        total:10000,
        time:{start:'2022-04-01 12:00:00',end:'2022-05-01 12:00:00'},
        state: {code:1,msg:'已触发'},
        
    });

    retObj.myPolicy.push({
        id:'9d4OT0KpHxgapX7rdYmkn',
        total:20000,
        time:{start:'2022-03-01 12:00:00',end:'2022-04-01 12:00:00'},
        state: {code:1,msg:'已触发'},
    });

    retObj.myPolicy.push({
        id:'293KOshuaLKdhufh00aha57',
        total:5000,
        time:{start:'2022-02-01 12:00:00',end:'2022-05-02 12:00:00'},
        state: {code:2,msg:'已过期'},
    });

    ctx.response.type = "application/json";
    ctx.response.body = retObj;

};

//检查单条策略
const checkPolicyItem = async(ctx, next)=>{
    const reqBody = ctx.request.body;
    const {code} = reqBody;
    console.log('check policy item: ',code);
    const retObj = {
        state:false,
        msg:'该股票代码不存在',
    }

    if(checkStockCode(code)){
        retObj.state = true;
        retObj.msg='';
    }
    await next();
    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//策略设置
const setpolicy = async(ctx, next)=>{
    const reqBody = ctx.request.body;
    console.log('set policy: ',reqBody);
    let retObj = {
        id:'',
        total:0,
        time:{start:'',end:''},
        state: {code:0,msg:'执行中'},
        success: false,
        msg:'未知错误',
    }

    await next();

    retObj.id = nanoid();
    retObj.time = reqBody.time;
    retObj.success=true;
    retObj.msg='';
    reqBody.policys.forEach((item)=>{
        if(item.amount.type === 0){
            // console.log(item.conditionValue);
            retObj.total += Number(item.amount.value);
        }
    });

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

module.exports = {
    initpolicy:initpolicy,
    checkPolicyItem:checkPolicyItem,
    setpolicy:setpolicy,
};