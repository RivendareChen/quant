const net = require('net');
const crypto = require('crypto'); //解码模块
const proto = require('./pb');

//将ProtoId复制到新建对象ProtoName， 并交换键和值（名称：端口号->端口号：名称）
const ProtoId = require('./protoid');
const { resolve } = require('path');
const { timeStamp } = require('console');
const { rejects } = require('assert');
const { threadId } = require('worker_threads');
const ProtoName = {};
Object.keys(ProtoId).forEach((key)=>{
    ProtoName[ProtoId[key]] = key;
});

//全局变量
let id = 1;

class Socket{
  /** 构造函数
    * @param {string} ip     FutuOpenD ip
    * @param {number} port   FutuOpenD 端口
    */

    constructor(ip, port){
        id +=1; //全局变量socket的id 随链接创建而自增

        this.id = id;
        this.name = `socket ${this.id}`;
        this.ip = ip;
        this.port = port;

        //是否已经连接
        this.isConnect = false;

        //请求序列号 自增
        this.requestId = 1000;
        
        this.isHandStop = false;
        this.root = proto;

        //缓存回调函数
        this.cacheResponseCallback = {};
        //缓存通知回调函数
        this.cacheNotifyCallback = {};

        //缓存接受到的数据包头
        this.header = null; 
        //缓存接收到的数据
        this.recvBuffer = Buffer.allocUnsafe(0);

        this.socket = new net.Socket();
        this.socket.setKeepAlive(true);
        //socket出现错误
        this.socket.on('error', (data)=>{
            console.error(`${this.name} is error: ${data}`);
            this.socket.destroy();
            this.isConnect = false;
        });
        //socket连接超时
        this.socket.on('timeout', (err)=>{
            console.error(`${this.name} is timeout: ${err}`);
            this.socket.destroy();
            this.isConnect = false;
        });
        //socket正在退出
        this.socket.on('close', ()=>{
            if(this.isHandStop)return;
            const errMsg = `${this.name} is on closed, please retry on 5s`;
            console.error(errMsg);
            this.isConnect = false;
            // 5秒后重连 timerReconnect???
            if(this.timerRecontent) return;
            this.timerRecontent = setTimeout(()=>{
                this.init();
            }, 5000);
        });
        //接收数据
        this.socket.on('data', (data)=>{
            this.recvBuffer = Buffer.concat([this.recvBuffer, data]);
            this.parseData();
        });
    }

    /**
     * 成员函数 初始化
     */
    // 类class内部 不允许成员函数使用 function关键字
    async init() {
        if(this.isConnect)return;
        await this.connect();
    }

    /**
     * 成员函数 连接
     */
    async connect(){
        this.isHandStop = false;
        return new Promise((resolve)=>{
            //开始连接 若有重连倒计时 清空它
            if(this.timerRecontent){
                clearTimeout(this.timerRecontent);
                this.timerRecontent = null;
            }
            this.socket.connect(
                {
                port: this.port,
                host: this.ip,
                timeout:30000,  //30s未连接 定义超时
                },
                async ()=>{
                    let sucessMsg = `${this.name} connect sucess:${this.ip}:${this.port}`;
                    console.debug(sucessMsg);
                    this.isConnect = true;
                    //连接成功 如果存在连接回调函数 调用它
                    if(typeof this.connectCallback === 'function')
                        this.connectCallback();
                    resolve();
                }
            );
        });
    }

    /**
     * 成员函数 主动关闭连接
     */
    async close(){
        this.socket.end();
        this.socket.destroy();
        this.isHandStop = true;
        console.info('close socket manually')
    }

    /**
     * 成员函数 设置连接成功的回调函数
     * @param {function} cb
     */
    onConnect(cb){
        //设置 connect 中的 连接成功回调函数
        this.connectCallback = cb;
    }

    /**
     * 成员函数 注册协议的通知
     * @param {number} protoId 协议id
     * @param {function} callback 回到函数
     */
    subNotify(protoId, callback){
        this.cacheNotifyCallback[protoId] = callback;
    }

    /**
     * 成员函数 删除一个通知
     * @param {number} protoId 协议id
     */
    unsubNotify(protoId){
        if(this.cacheNotifyCallback[protoId]){
            delete this.cacheNotifyCallback[protoId];
        }
    }

    /**
     * 成员函数 发送数据
     * @async
     * @param {string} protoName 协议名称
     * @param {object} message 发送的数据
     */
    send(protoName, message){
        // 检查
        if(!this.isConnect){
            return console.warn(`${this.name} hasn't connect, can't send data`);
        }
        const protoId = ProtoId[protoName];
        if(!protoId){
            return console.warn(`can't find protoId:${protoName}`);
        }
        //请求序列号过大时，最近的请求的序列号初始化为最小值
        if(this.requestId>1000000){
            this.requestId=1000;
        }
        //解构赋值 const requestId = this.requestId;
        const {requestId} = this;
        this.requestId++;

        // 调用 ./src/pb.js 重点关注安全性
        const request = this.root[protoName].Request;
        const response = this.root[protoName].Response;
        //处理请求数据
        const reqBuffer = request.encode(
            request.create({
                c2s:message,
            })
        ).finish();
        
        //使用安全哈希算法(sha1)将请求信息转换为一段160位的十六进制消息摘要
        //sha1为hex字符串
        const sha1 = crypto
            .createHash('sha1')
            .update(reqBuffer) 
            .digest('hex'); //返回字符串
        
        //Uint8Array(20):20个8位无符号整数，对应sha1生成的160位消息摘要
        //160位二进制可表示为40个16进制
        //map对数据中的每个元素进行操作，接受一个匿名函数为参数 此函数的第一个参数为当前元素的值，第二个为此元素下标
        
        const sha1Buffer = new Uint8Array(20).map((item, index)=>{
            //8个二进制位 表示两个16进制位
            //将sha1字符串转为八位无符号整数
            return Number(`0x${sha1.substr(index*2,2)}`)
        });
        
        if(protoId != 1004 && protoId != 3012 && protoId != 3001) //KeepAlive orderbook调用频繁 忽视
            console.debug(`request:${protoName}:${protoId}, requestId:${requestId}`);
        
        //封装包头
        const buffer = Buffer.concat([
            Buffer.from('FT'), //包头起始标志 固定为FT
            Buffer.from(new Uint32Array([protoId]).buffer), //协议ID
            Buffer.from(new Uint8Array([0]).buffer),     //格式类型 0位protobuf 1为json
            Buffer.from(new Uint8Array([0]).buffer),     //协议版本
            Buffer.from(new Uint32Array([requestId]).buffer),  //包序列号 配对req和res 要求递增
            Buffer.from(new Uint32Array([reqBuffer.length]).buffer), //包体长度
            Buffer.from(sha1Buffer.buffer),  //包体原始数据的sha1
            Buffer.from(new Uint8Array([0,0,0,0,0,0,0,0]).buffer), //保留8Byte扩展
            reqBuffer,  //包体数据
        ]);

        //发送请求 处理回调
        this.socket.write(buffer);
        return new Promise((resolve, reject)=>{
            this.cacheResponseCallback[requestId] = (responseBuffer)=>{
                const result = response.decode(responseBuffer).toJSON();
                if(result.retType === 0){
                    return resolve(result.s2c);
                }
                const errMsg = `server return bad, request:${protoName}(${protoId}),retType:${result.retType},reqId:${requestId},errMsg:${result.retMsg}`
                console.error(errMsg);
                return reject(new Error(errMsg));
            };
        });

    }

    /**
     * 成员函数 解包
     */
    parseData(){
        const headerLen = 44; //包头长度 0-43
        let bodyBuffer = null; //包体buff
        let bodyLen = 0;     //包体长度
        let reqId = null;   // 请求序列号
        let protoId = null;  // 请求协议Id
        let bodySha1 = null; //包体sha1

        //处理包头 条件包头未初始化 且 包头已经被接收到
        if(!this.header && this.recvBuffer.length>=headerLen){
            let recvSha1 = new Array(21)
            .join('0') //20个间隔 全部初始化为'0'
            .split('') //成为长20，值全为'0'的数组
            .map((item, index)=>{
                // 读取包头第16-35个8八字节单位 为sha1签名,转为字符串并放入recvSha1
                let str = this.recvBuffer.readUInt8(16+index).toString(16);
                if(str.length === 1){
                    //如果只有一位16进制（最多有两位）如a，则加长为0a
                    str = `0${str}`;
                }
                //map 的返回值将替代数组中当前的item
                return str;
            });

            //recvSha1数组变为一个长度为40的字符串 每两个字符存储一到两个16进制（对应一个8字节）
            recvSha1 = recvSha1.join('');

            this.header = {
                szHeaderFlag: //FT 第 0，1个8字节单位
                    String.fromCharCode(this.recvBuffer.readUInt8(0))+String.fromCharCode(this.recvBuffer.readUInt8(1)),
                nProtoID:  //协议ID 第 2，3，4，5个8字节单位
                    this.recvBuffer.readUInt32LE(2),
                nProtoFmtType: //协议格式类型 第6个8字节单位
                    this.recvBuffer.readUInt8(6),
                nProtoVer:  //协议版本 第7个8字节单位
                    this.recvBuffer.readUInt8(7),
                nSerialNo:  //包序列号 第8，9，10，11个8字节单位
                    this.recvBuffer.readUInt32LE(8),
                nBoayLen:  //包体长度 第12，13，14，15个8字节单位
                    this.recvBuffer.readUInt32LE(12),
                arrBodySHA1: //包体原数据 第16-35个8字节单位（已经读取）
                    recvSha1,
                arrReserved: //保留8字节扩展 第36-43个八字节单位
                    this.recvBuffer.slice(36,44),  //not inclusive 44
            };

            //校对包头
            if(this.header.szHeaderFlag !== 'FT'){
                throw new Error('format error!!!');
            }
            
            if(this.header.nProtoID!=1004 && this.header.nProtoID!=3012 && this.header.nProtoID!=3001) //KeepAlive调用频繁 忽视
                console.debug(`response:${ProtoName[this.header.nProtoID]}(${this.header.nProtoID}), 
                           reqId:${this.header.nSerialNo}, bodyLen:${bodyLen}`);
        }

        // 已经接收指定包体长度的全部数据， 切割包体(包头已经处理)
        if(this.header && this.recvBuffer.length >= this.header.nBoayLen+headerLen){
            reqId = this.header.nSerialNo;
            protoId = this.header.nProtoID;
            bodyLen = this.header.nBoayLen;
            bodySha1 = this.header.arrBodySHA1;
            this.header = null; //??? 是否应该

            //切包
            //从包头结束到包体长度指定位置，为当前包体内容
            bodyBuffer = this.recvBuffer.slice(44, bodyLen+headerLen);
            //包体结束位置是下个包开始位置，缓存到recvBuffer中待下次处理
            this.recvBuffer = this.recvBuffer.slice(bodyLen+headerLen);

            //验证签名
            const sha1 = crypto
                         .createHash('sha1')
                         .update(bodyBuffer)
                         .digest('hex');
            if(sha1 !== bodySha1){
                throw new Error(`sha1 digest error:  head:${bodySha1}, body:${sha1}`);
            }

            //把包体数据交给回调函数处理
            if(this.cacheResponseCallback[reqId]){
                this.cacheResponseCallback[reqId](bodyBuffer);
                delete this.cacheResponseCallback[reqId];
            }

            //通知模块
            if(this.cacheNotifyCallback[protoId]){
                try{
                    const protoName = ProtoName[protoId];
                    const response = this.root[protoName].Response;
                    const result = response.decode(bodyBuffer).toJSON();
                    this.cacheNotifyCallback[protoId](result.s2c);
                }catch(e){
                    console.error('notify callback error: '+e);
                    throw new Error('notify callback error');
                }
            }
            //不光接收到数据时要parseData，parse完一次data后若还有缓存包未处理也要继续parse，主要针对on data一次接收到不止一个包
            //nodejs单线程 不必担心一个对象的函数被重复调用（parsedata
            if(this.recvBuffer.length>headerLen){
                this.parseData();
            }
        }
    }
}


module.exports = Socket;

//const res = proto['Qot_UpdateBasicQot'].Response;
//console.log(res);
