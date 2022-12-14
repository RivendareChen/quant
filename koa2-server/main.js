const Koa = require('koa');
const path = require('path');
const bodyParser = require('koa-bodyparser');
const server = require('koa-static');
const mongoose = require('mongoose');

const {browserTotalRouter,hashTotalRouter} = require('./config/router.js');
const {prevAuthCheck} = require('./app/controllers/globalMidware.js');

const FtQuant = require('../futu-quant/futuquant');
const {testFtConfig} = require('../futu-quant/config');


//启动工程服务器
async function init(port=3000,dbName='test',srcPath='./source/static/build'){

    //连接数据库
    try{
        await mongoose.connect("mongodb://127.0.0.1:27017/"+dbName);
        console.log('db connect success!');
    }catch(err){
        console.log('db connect fail',err);
        return;
    }

    //连接FutuOpenD
    const quant = new FtQuant(testFtConfig);
    try{
        await quant.init();
        console.log('futu connect success!');
    }
    catch(err){
        console.log('futu connet fail',err);
        return;
    }

    //服务实例
    const app = new Koa();

    // 挂载futuquant类实例
    app.use(async(ctx,next)=>{
        ctx.quant = quant;
        await next();
    });

    //顶层中间件 验证用户权限
    app.use(prevAuthCheck);

    //解析数据请求中间件
    app.use(bodyParser());

    //路由中间件
    if(srcPath.split('/').slice(-1)[0]==='hash'){
        console.log('使用Hash路由');
        app.use(hashTotalRouter.routes());
    }
    else{
        console.log('使用Browser路由');
        app.use(browserTotalRouter.routes());
    }

    //静态文件中间件,需要再router之后use，以实现路由配置
    app.use(server(path.join(__dirname, srcPath)));

    app.listen(port);
    console.log(`已启动工程服务器\n请直接打开http://localhost:${port}`);
}

//启动测试服务器
async function testinit(port=7777, dbName='test'){

    //连接数据库
    try{
        await mongoose.connect("mongodb://127.0.0.1:27017/"+dbName);
        console.log('db connect success!');
    }catch(err){
        console.log('db connect fail',err);
    }

    //连接FutuOpenD
    const quant = new FtQuant(testFtConfig);
    try{
        await quant.init();
        console.log('futu connect success!');
    }
    catch(err){
        console.log('futu connet fail',err);
        return;
    }

    //服务实例
    const app = new Koa();

    // 挂载futuquant类实例
    app.use(async(ctx,next)=>{
        ctx.quant = quant;
        await next();
    });
    
    //顶层中间件 验证用户权限
    app.use(prevAuthCheck);

    //解析数据请求中间件
    app.use(bodyParser());

    //路由中间件，因为静态资源在create-react-app的服务器上，因此不需要配置koa-static
    app.use(hashTotalRouter.routes());
    

    app.listen(port);
    console.log(`已启动测试服务器\n请配合create-react-app使用\n(配置其代理至localhost:${port})`);
}


//启动工程模式。如需启动测试模式，请注释下方第一条代码。
init(3000,'test','./source/static/build');

//启动测试模式。如需启动工程模式，请注释下方第一条代码。
// testinit(7777, 'test');