// const { InitConnect, GetGlobalState } = require('./pb');
// const { Trd_GetHistoryOrderList } = require('./protoid');
const Socket = require('./socket');

const sleep = async function(timeout){
    new Promise((resolve)=>{
        setTimeout(resolve, timeout);
    });
};

class FutuQuant{
    /**
     * 构造函数
     * @param {objec} params
     * @param {string} params.ip  FutoOpenD ip
     * @param {number} params.port FutoOpenD 端口
     * @param {number} params.userID 牛牛号
     * @param {string} params.pwdMd5 md5口令
     * @param {TrdMarket} [params.market] 市场 默认1港股
     * @param {TrdEnv} [params.env] 0为仿真环境 1为真实环境 默认0
     * @memberof FutoQuant
     */
    constructor(params){
        //验证参数
        if(typeof params !== 'object')throw new Error('erro params');
        const {ip, port, userID, market, pwdMd5, env} = params;
        if(!ip)throw new Error('no ip');
        if(!port)throw new Error('no port');
        if(!userID)throw new Error('no userid');
        // if(!pwdMd5)throw new Error('no pwd');

        this.userID = userID;
        this.pwdMd5 = pwdMd5;
        this.market = market || 1; //默认港股
        this.params = params;

        this.env = env;
        if(typeof this.env !== 'number') this.env = 0 //默认为仿真环境

        //实例化一个Sokcet对象
        this.socket = new Socket(ip, port);

        this.inited = false; //是否已经初始化
        this.trdHeader = null; //交易公共头部信息
        this.timerKeepLive = null; //保持心跳定时器
    }

    /**
     * private 成员函数 线程睡眠
     */
    async sleep(time){
        new Promise((resolve)=>{
            setTimeout(resolve, time);
        });
    };

    /**
     * private 成员函数 限制接口调用频率
     * 
     */
    async limitExecTimes(interval, times, fn){
        const now = Date.now();
        const name = `${fn.toStting()}_exec_time_array`;
        const execArray = this[name] || [];
        while(execArray[0] && now-execArray[0]>interval){
            //移除第一个元素
            execArray.shift();
        }
        if(execArray.length>times){
            await sleep(interval - (now - execArray[0]));
        }
        execArray.push(Data.now());
        this[name] = execArray;
        return fn();
    }

    /**
     * 成员函数 初始化处理
     * 
     */
    async init(){
        if(this.inited)return;
        let res = await this.initConnect();
        /* 交易相关 初始化 todo
        await this.limitExecTimes(30000, 10, async()=>{
            //解锁交易密码 todo
        });
        //获取交易账户 todo
        //设置为港股真实环境 //todo
        */
        this.inited = true;
        return res;
    }

    /**
     *成员函数 初始化连接 协议代号1001
     *请求其他协议前必须等待initConnect协议完成
     *KeepAliveInterval 为建议client发起心跳KeepAlive的间隔
     *
     * 参数与返回参见 https://github.com/RivendareChen/FutuProto/blob/master/InitConnect.proto
     * 函数参数
     * @param {object} params 初始化参数
     * @param {number} params.clientVer 客户端版本号 "."前的数*100+"."以后的数
     * @param {string} params.clientID 客户端ID 保持唯一性即可
     * @param {boolean} params.recvNotify 此连接是否接收市场状态、交易需重新解锁等事件通知
     * 
     * @returns {InitConnectResponse}
     * 函数返回
     * @typedef InitConnectResponse
     * @property {number} serverVer FutuOpenD版本号
     * @property {number} loginUserID FutuOpenD登录的牛牛号
     * @property {number} connID 此连接的ID 链接的唯一标识
     * @property {string} connAESKey 此链接后续AES加密通信的Key 固定为16字节
     * @property {number} KeepAliveInterval 心跳间隔
     */
    async initConnect(params){
        if(this.inited)throw new Error('connection has already inited,do not try again');
        return new Promise(async(resolve)=>{
            this.socket.onConnect(async()=>{
                const res = await this.socket.send(
                    'InitConnect',
                    Object.assign({
                        clientVer:101,
                        clientID:'rivenchen',
                        recvNotify: true,
                    },params)
                );
                this.connID = res.connID;
                this.connAESKey = res.connAESKey;
                this.KeepAliveInterval = res.KeepAliveInterval;

                if(this.timerKeepLive){
                    clearInterval(this.timerKeepLive);
                    this.timerKeepLive = null;
                }
                this.timerKeepLive = setInterval(()=>{
                    //setInterval间隔一段时间后 再次运行函数
                    this.KeepAlive();
                }, 1000*this.KeepAliveInterval);
                
                resolve(res);
            });
            //需要先绑定连接成功后的回调函数 使用onConnect绑定
            await this.socket.init();
        });
    }

    /**
     * 成员函数  断开连接
     */
    close(){
        if(this.timerKeepLive){
            clearInterval(this.timerKeepLive);
            this.socket.close();
            this.inited = false;
        }
    }

    /**
     * @async
     * 成员函数 获取全局状态 协议代号1002
     * 详情参见 https://github.com/RivendareChen/FutuProto/blob/master/GetGlobalState.proto
     * @returns {GetGlobalStateResponse}
     * 函数返回
     * @typedef GetGlobalStateResponse
     * @property {QotMarketState} marketHK Qot_Common.QotMarketState,港股主板市场状态
     * @property {QotMarketState} marketUS Qot_Common.QotMarketState,美股Nasdaq市场状态
     * @property {QotMarketState} marketSH Qot_Common.QotMarketState,沪市状态
     * @property {QotMarketState} marketSZ Qot_Common.QotMarketState,深市状态
     * @property {QotMarketState} marketHKFuture Qot_Common.QotMarketState,港股期货市场状态
     * @property {boolean} qotLogined 是否登陆行情服务器
     * @property {boolean} trdLogined 是否登陆交易服务器
     * @property {number} serverVer 版本号
     * @property {number} serverBuildNo buildNo
     * @property {number} time 当前格林威治时间
     */
    getGlobalState(){
        return this.socket.send('GetGlobalState', {
            userID:this.userID,
        });
    }

    /**
     * 成员函数 保持心跳 协议代号 1004
     * @returns {number} time 服务器回包时间戳 单位秒
     * 详见 https://github.com/RivendareChen/FutuProto/blob/master/KeepAlive.proto
     */
    async KeepAlive(){
        const time = await this.socket.send('KeepAlive', {
            //发包时间戳
            time: Math.round(Date.now()/1000),
        });
        return time;
    }

    /**
     * 成员函数 订阅与反订阅 协议端口3001
     * @async
     * 行情数据接口需要该股票被订阅后才能使用
     * 股票总订阅数量有一定额度限制
     * 详见 https://github.com/RivendareChen/FutuProto/blob/master/Qot_Sub.proto
     * @param {Object} params Object
     * @param {Security[]} params.securityList 股票
     * @param {SubType[]} params.subTypeList Qot_Common.SubType,订阅数据类型
     * @param {boolean} [params.isSubOrUnSub=true] ture表示订阅,false表示反订阅
     * @param {boolean} [params.isRegOrUnRegPush=true] 是否注册或反注册该连接上面行情的推送,该参数不指定不做注册反注册操作
     * @param {number} params.regPushRehabTypeList Qot_Common.RehabType,复权类型,注册推送并且是K线类型才生效,其他订阅类型忽略该参数,注册K线推送时该参数不指定默认前复权
     * @param {boolean} [params.isFirstPush=true] 注册后如果本地已有数据是否首推一次已存在数据,该参数不指定则默认true
     */
    qotSub(params){
        return this.socket.send(
            'Qot_Sub',
            Object.assign({
                securityList:[],
                subTypeList:[],
                isSubOrUnSub: true, //默认为订阅
                isRegOrUnRegPush: true,
                regPushRehabTypeList: [], //推送K线时需要指定
                isFirstPush: true
            },params)
        );
    }

    /**
     * 成员函数 注册行情推送 协议端口3002
     * 需要先订阅才能注册行情推送
     * 详见 https://github.com/RivendareChen/FutuProto/blob/master/Qot_RegQotPush.proto
     * @param {Security[]} params.securityList 股票
     * @param {SubType[]} params.subTypeList Qot_Common.SubType,订阅数据类型
     * @param {SubType[]} params.rehabTypeList Qot_Common.RehabType,复权类型,注册K线类型才生效,其他订阅类型忽略该参数,注册K线时该参数不指定默认前复权
     * @param {boolean} [params.isRegOrUnReg=true] 注册或取消
     * @param {boolean} [params.isFirstPush=true] 注册后如果本地已有数据是否首推一次已存在数据,该参数不指定则默认true
     */
    qotRegQotPush(params){
        return this.socket.send(
            'Qot_RegQotPush',
            Object.assign({
                securityList:[],
                subTypeList:[],
                rehabTypeList:[],
                isRegOrUnReg:true,
                isFirstPush: true,
            },params)
        );
    }

    /**
     * 成员函数 获取订阅信息 协议端口3003
     * @async
     * 详见 https://github.com/RivendareChen/FutuProto/blob/master/Qot_GetSubInfo.proto
     * 函数参数
     * @param {boolean} [isReqAllConn = false] 是否返回所有连接的订阅1状态
     * @returns {QotGetSubInfoResponse}
     * 
     * 函数返回
     * @typedef QotGetSubInfoResponse
     * @property {ConnSubInfo[]} ConnSubInfoList 订阅信息
     * @property {number} totalUsedQuota FutuOpenD已使用订阅额度
     * @property {number} remainQuota FutuOpenD剩余订阅额度
     */
    qotGetSubInfo(isReqAllConn = false){
        return this.socket.send(
            'Qot_GetSubInfo',  //与原方案不同？？？
            {isReqAllConn,});
    }

    /**
     * 成员函数 获取股票的基本行情 协议端口3004
     * 详见 https://github.com/RivendareChen/FutuProto/blob/master/Qot_GetBasicQot.proto
     * 函数参数
     * @param {Security[]} securityList 股票列表
     * @returns {BasicQot[]} basicQotList 股票基本报价
     */
    async qotGetBasicQot(securityList){
        return (
            (
                await this.socket.send(
                    'Qot_GetBasicQot',
                    {securityList}
                )
            ).basicQotList || []
        );
    }

    /**
     * 成员函数 获取股票基本报价通知 协议端口3005
     * 需要先订阅
     * 详见 https://github.com/RivendareChen/FutuProto/blob/master/Qot_UpdateBasicQot.proto
     * @param {function} backcall 回调函数
     * @returns {BasicQot[]} basicQotList
     */
    subQotUpdateBasicQot(callback){ 
        return this.socket.subNotify(3005, 
            (data)=>{
                callback(data.basicQotList || [])
            });
    }

    /********************* 主要功能 *********************/
    
    /**
     * 成员函数 获取k线 协议端口3006
     * 详见 https://github.com/RivendareChen/FutuProto/blob/master/Qot_GetKL.proto
     * 
     * 函数参数
     * @param {object} params
     * @param {RehabType} params.rehabType Qot_Common.RehabType,复权类型
     * @param {KLType} params.klType Qot_Common.KLType,K线类型
     * @param {Security} params.security 股票
     * @param {number} params.reqNum 请求K线根数 最多1000根
     * 函数返回
     * @returns {KLine[]} k线点
     */
    async qotGetKL(params){
        return (
            (
                await this.socket.send(
                    'Qot_GetKL',
                    Object.assign(
                        {
                            rehabType: 1,
                            klType: 1,
                            security: {},
                            reqNum: 60
                        },params)
                )
            ).klList||[]
        );
    }

    /**
     * 成员函数 注册k线推送 协议端口3007
     * 需要先订阅
     * 详见 https://github.com/RivendareChen/FutuProto/blob/master/Qot_UpdateKL.proto
     * 函数参数
     * @param {function} callback
     * @returns {QotUpdateKLResponse}
     * 
     * 协议返回对象
     * @typedef QotUpdateKLResponse
     * @property {RehabType} rehabType Qot_Common.RehabType,复权类型
     * @property {KLType} klType Qot_Common.KLType,K线类型
     * @property {Security} security 股票
     * @property {KLine[]} klList 推送的k线点
     */
    subQotUpdateKL(callback){
        return this.socket.subNotify(3007, callback);
    }

    /**
     * 成员函数 获取逐笔 协议端口3010
     * 详见 https://github.com/RivendareChen/FutuProto/blob/master/Qot_GetTicker.proto
     * 函数参数
     * @param {Security} security 股票
     */
    async qotGetTicker(security, maxRetNum = 100){
        return (
            (
                await this.socket.send('Qot_GetTicker',{
                    security,
                    maxRetNum,
                })
            ).tickerList || []
        );
    }

    /**
     * 成员函数 注册逐笔推送 协议端口3011
     * 需要先订阅
     * 详见 https://github.com/RivendareChen/FutuProto/blob/master/Qot_UpdateTicker.proto
     * 函数参数
     * @param {function} callback
     * @returns {subQotUpdateTickerResponse}
     * 
     * 协议返回
     * @typedef subQotUpdateTickerResponse
     * @property {Security} security 股票
     * @property {Ticker[]} tickerList 逐笔
     */
    subQotUpdateTicker(callback){
        return this.socket.subNotify(3011, callback);
    }

    /**
     * 成员函数 获取单只股票一段历史K线 协议端口3100
     * 详见 https://github.com/RivendareChen/FutuProto/blob/master/Qot_GetHistoryKL.proto
     * 函数参数 
     * @param {object} params
     * @param {RehabType} params.rehabType Qot_Common.RehabType,复权类型
     * @param {KLType} params.klType Qot_Common.KLType,K线类型
     * @param {Security} params.security 股票市场以及股票代码
     * @param {string} params.beginTime 开始时间字符串
     * @param {string} params.endTime 结束时间字符串
     * @param {number} [params.maxAckKLNum] 最多返回多少根K线，如果未指定表示不限制
     * @param {number} [params.needKLFieldsFlag] 指定返回K线结构体特定某几项数据，KLFields枚举值或组合，如果未指定返回全部字段
     * 
     * 函数返回
     * @returns {KLine[]}
     */
    async qotGetHistoryKL(params){
        console.log(params);
        return (
            (
                await this.socket.send(
                    'Qot_GetHistoryKL',
                    Object.assign({
                        rehabType: 1,
                        klType: 2,
                        security:{},
                        beginTime: '',
                        endTime: '',
                        maxAckKLNum:60,
                    }, params)
                )
            ).klList || []
        );
    }

    /**
     * 成员函数 获取多只股票多点历史k线
     * 详见 https://github.com/RivendareChen/FutuProto/blob/master/Qot_GetHistoryKLPoints.proto
     * 函数参数
     * @param {object} params
     * @param {RehabType} params.rehabType Qot_Common.RehabType,复权类型
     * @param {KLType} params.klType Qot_Common.KLType,K线类型
     * @param {NoDataMode} params.noDataMode NoDataMode,当请求时间点数据为空时，如何返回数据
     * NoDataMode_Null = 0; //直接返回空数据
       NoDataMode_Forward = 1; //往前取值，返回前一个时间点数据
       NoDataMode_Backward = 2; //向后取值，返回后一个时间点数据
     * @param {Security[]} params.securityList 股票市场以及股票代码
     * @param {string[]} params.timeList 时间字符串
     * @param {number} [params.maxReqSecurityNum] 最多返回多少只股票的数据，如果未指定表示不限制
     * @param {KLFields} [params.needKLFieldsFlag] 指定返回K线结构体特定某几项数据，KLFields枚举值或组合，如果未指定返回全部字段
     * @returns {SecurityHistoryKLPoints[]}
     * 
     * 函数返回
     * @typedef SecurityHistoryKLPoints
     * @property {Security} security 股票
     * @property {HistoryPointsKL} klList K线数据
     * k线数据
     * @typedef HistoryPointsKL
     * @property {DataStatus} status DataStatus,数据状态
     * DataStatus_Null = 0; //空数据
       DataStatus_Current = 1; //当前时间点数据
       DataStatus_Previous = 2; //前一个时间点数据
       DataStatus_Back = 3; //后一个时间点数据
     * @property {string} reqTime 请求的时间
     * @property {KLine} kl K线数据
     * 
     */
    async qotGetHistoryKLPoints(params){
        return (
            this.socket.send(
                'Qot_GetHistoryKLPoints',
                Object.assign({
                    rehabType: 1,
                    klType: 1,
                    noDataMode: 0,
                    securityList: [],
                    timeList:[],
                    maxReqSecurityNum: 60,
                    needKLFieldsFlag: 512,
                }, params)
            ).klPointList || []
        );
    }
}

module.exports = FutuQuant;