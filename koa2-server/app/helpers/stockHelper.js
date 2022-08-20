const stockInfo = require('./stockData');

function checkStockCode(code){
    if((code in stockInfo)){
        const info = {...stockInfo[code]};
        return info;
    }
    else{
        return false;
    }
};

module.exports = {
    checkStockCode:checkStockCode,
};