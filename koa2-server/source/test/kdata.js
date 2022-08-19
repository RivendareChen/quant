const {kdata} = require('./data/data.test.1.js');


// k线数据
const kData1 = {
	typeMin: kdata[0][0],
	typeHour: kdata[0][1],
	typeDay: kdata[0][2],
	typeWeek: kdata[0][3],
	typeMonth: kdata[0][4],
}

const kData2 = {
	typeMin: kdata[1][0],
	typeHour: kdata[1][1],
	typeDay: kdata[1][2],
	typeWeek: kdata[1][3],
	typeMonth: kdata[1][4],
}

const kData3 = {
	typeMin: kdata[2][0],
	typeHour: kdata[2][1],
	typeDay: kdata[2][2],
	typeWeek: kdata[2][3],
	typeMonth: kdata[2][4],
}

//基本信息数据
const infoData1 = {
	code: '00001',
	name: '长和',
	en:'CKH HOLDINGS',
	price: 55.8,
	trend: 0.0018,
	low:54.9,
	high:56.1,
	vol:3200,
	// trend: -0.0019,
}

const infoData2 = {
	code: '00002',
	name: '中电控股',
	en:'CLP HOLDINGS',
	price: 77.5,
	trend: -0.00155,
	low:76.3,
	high:80.2,
	vol:5600,
}

const infoData3 = {
	code: '00003',
	name: '香港中华煤气',
	en:'HK & CHINA GAS',
	price: 8.86,
	trend: -0.00225,
	low:8.71,
	high:8.92,
	vol:6708,
}

//交易数据
const trade1 = {
	info:{
		name:'s8cn05aKC4ISLhYGxIJ97',
		startTime:'2022-04-01 12:00:00',
		tradeTime:'2022-04-03 14:51:00',
		total:10000.00,
		type:'自定交易策略',
		state:{code:0,msg:'交易成功'},
	},
	details:[
		{
			code:'长和00001',
			time:'2022-04-03 14:50:00',
			price:50,
			quantity:'买入100',
			total:5000,
			policy:'MA上穿500'
		},
		{
			code:'中电控股00002',
			time:'2022-04-03 14:40:00',
			price:20,
			quantity:'买入100',
			total:2000,
			policy:'MACD下穿300'
		},
		{
			code:'香港中华煤气00003',
			time:'2022-04-03 14:30:00',
			price:10,
			quantity:'买入300',
			total:3000,
			policy:'K上穿100'
		},
	],
}

const trade2 = {
	info:{
		name:'9d4OT0KpHxgapX7rdYmkn',
		startTime:'2022-03-01 12:00:00',
		tradeTime:'2022-03-13 11:00:00',
		total:20000.00,
		type:'自定交易策略',
		state:{code:0,msg:'交易成功'},
	},
	details:[
		{
			code:'长和00001',
			time:'2022-03-13 10:30:00',
			price:100,
			quantity:'卖出150',
			total:15000,
			policy:'K上穿400'
		},
		{
			code:'香港中华煤气00003',
			time:'2022-03-13 10:40:00',
			price:50,
			quantity:'卖出100',
			total:5000,
			policy:'MA下穿300'
		},
	],
}


module.exports = {
	kdata: [kData1, kData2, kData3],
	info:  [infoData1, infoData2, infoData3],
	trade: [trade1, trade2],
};