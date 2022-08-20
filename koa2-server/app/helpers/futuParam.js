module.exports = {
    getSubTemp:
    ()=>{
        return {
            //集合内第一个为行情市场 1为港股  第二个为股票代码
            securityList: [],  //{market: 1,code:''}
            subTypeList:[], //1,6,10,11,12,13 -> 基础报价 日k 时k 分k 周k 月k
            isSubOrUnSub: true, //true表订阅 false表反订阅
            isRegOrUnRegPush: false, //是否注册或反注册该连接上面行情的推送
            regPushRehabTypeList: 1, //复权类型，注册推送并是k线类型才生效
            isFirstPush: true,  //注册后若本地已有数据是否重推一次已存在数据
        };
    },
    getKlTemp:
    ()=>{
        return {
            rehabType: 1, //前复权
            klType: 1, // k线类型
            security: {market: 1,code:''},
            reqNum:100,
        };
    },
};