const Route = require('koa-router');

const authMid = require('../app/controllers/authMidware');
const headMid = require('../app/controllers/headMidware');
const mainMid = require('../app/controllers/mainMidware');
const starMid = require('../app/controllers/starMidware');
const tradeMid = require('../app/controllers/tradeMidware');
const policyMid = require('../app/controllers/policyMidware');

const setHashTotalRouter = ()=>{
    const router = Route();

    //设置各模块的业务中间件
    for(let key in authMid){
        router.post(`/${key}`,authMid[key]);
    }
    for(let key in headMid){
        router.post(`/${key}`,headMid[key]);
    }
    for(let key in mainMid){
        router.post(`/${key}`,mainMid[key]);
    }
    for(let key in starMid){
        router.post(`/${key}`,starMid[key]);
    }
    for(let key in tradeMid){
        router.post(`/${key}`,tradeMid[key]);
    }
    for(let key in policyMid){
        router.post(`/${key}`,policyMid[key]);
    }
    return router;
}

const setBrowserTotalRouter = ()=>{
    const router = Route();

    //设置各模块的业务中间件
    for(let key in authMid){
        router.post(`/${key}`,authMid[key]);
    }
    for(let key in headMid){
        router.post(`/${key}`,headMid[key]);
    }
    for(let key in mainMid){
        router.post(`/${key}`,mainMid[key]);
    }
    for(let key in starMid){
        router.post(`/${key}`,starMid[key]);
    }
    for(let key in tradeMid){
        router.post(`/${key}`,tradeMid[key]);
    }
    for(let key in policyMid){
        router.post(`/${key}`,policyMid[key]);
    }

    

    //配置路由
    router.get('/register',async(ctx,next)=>{
        console.log('register page');
        ctx.request.path='/';
        await next();
    });
    router.get('/login',async(ctx, next)=>{
        console.log('login page');
        ctx.request.path='/';
        await next();
        
    });
    // koa-router的通配操作 
    // https://segmentfault.com/q/1010000013801773/a-1020000013805831
    router.get('/policy/(.*)',async(ctx, next)=>{
        console.log('policy page');
        ctx.request.path='/';
        await next();
    });
    router.get('/user/(.*)',async(ctx, next)=>{
        console.log('user page');
        ctx.request.path='/';
        await next();
    });
    
    return router;
}

module.exports = {
    browserTotalRouter:setBrowserTotalRouter(),
    hashTotalRouter:setHashTotalRouter(),
};
