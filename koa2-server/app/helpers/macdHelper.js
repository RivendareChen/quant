//Node.js的C++模块不支持跨平台，这里默认使用js计算ema
//非m1芯片mac的用户，请参照https://segmentfault.com/a/1190000023544791自行在cpp-module文件夹中配置。
// const {ema12, ema26, ema9} = require('../../../cpp-module/build/Release/EmaHelper');

//切割数组
function splitData(rawData){
    const datas = []; 
    const times = [];
    const vols = []; 
    for (let i = 0; i < rawData.length; ++i) {
      // splice会修改数组 此处为删除数组第一个元素
      times.push(rawData[i].splice(0, 1)[0]);
      // 因为删除了数组第一个元素 所以vol由5递补到4
      vols.push(rawData[i][4]);
      //除了时间的其他数据
      datas.push(rawData[i]);
    }
    return {
      datas:datas,
      times:times,
      vols:vols
    };
}

//计算macd 少算一个ma
function calcMA(dayCount,data){
    let total = 0;
    for(let i=0; i<dayCount; ++i){
        total += data[i][1];
    }
    const result = [];
    for (let i = 0; i < data.length; ++i) {
        if (i < dayCount-1) {
            //小于dayCount天 不计算ma
            result.push('-');
            continue;
        }

        if(i === dayCount-1){
            //刚好dayCount天
            result.push((total / dayCount).toFixed(2));
            continue;
        }
        
        //大于dayCount天 加当前价格 减最早价格
        total += data[i][1];
        total -= data[i-dayCount][1];
        result.push((total / dayCount).toFixed(2));
    }
    return result;
}

//计算EMA ema12、26初始值为收盘价
function calcEMA(n,data){
    if(n === 12){
        const ema=[data[0][1]];  
        for(let i=1; i<data.length; ++i){
            // ema.push(ema12(data[i][1],ema[i-1]));
            ema.push((0.153846*data[i][1]+0.84615*ema[i-1]).toFixed(3));
        }
        return ema;
    }

    if(n === 26){
        const ema=[data[0][1]];  
        for(let i=1; i<data.length; ++i){
            // ema.push(ema26(data[i][1],ema[i-1]));
            ema.push((0.074074*data[i][1]+0.925926*ema[i-1]).toFixed(3));
        }
        return ema;
    }

    if(n === 9){
        const ema=[data[0]];
        for(let i=1; i<data.length; ++i){
            // ema.push(ema9(data[i],ema[i-1]));
            ema.push((0.2*data[i]+0.8*ema[i-1]).toFixed(3));
        }
        return ema;
    }
    return [];
};

//计算DIF
function calcDIF(data){
    const dif=[];
    const emaShort=calcEMA(12,data);
    const emaLong=calcEMA(26,data);
    for(let i=0; i<data.length; ++i){
        dif.push(emaShort[i]-emaLong[i]);
    }
    return dif;
};

//计算DEA
function calcDEA(dif){
    return calcEMA(9,dif);
};

//计算MACD
function calcMACD (data){
    const result={};
    const dif=calcDIF(data);
    const dea=calcDEA(dif);
    const macd=[];
    for(let i=0; i<data.length; ++i){
        macd.push(((dif[i]-dea[i])*2).toFixed(3));
    }
    result.dif=dif;
    result.dea=dea;
    result.macd=macd;
    return result;
};



function kDataformat(kdata){
    if(!kdata) return {};
    const retData = {
        datas:[],
        macds:{},
        mas:{},
        vols:[],
        times:[],
    }
    const splitedData = splitData(kdata);

    retData.datas    = splitedData.datas;
    retData.times    = splitedData.times;
    retData.vols     = splitedData.vols;
    retData.macds    = calcMACD(splitedData.datas);
    retData.mas.ma30 = calcMA(30,splitedData.datas);
    retData.mas.ma10 = calcMA(10,splitedData.datas);
    retData.mas.ma5  = calcMA(5, splitedData.datas);

    return retData;
}

module.exports = {
    kDataformat:kDataformat,
};