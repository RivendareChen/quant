const {sessionModel} = require('../models/UserInfo.js');

//顶层中间件 挂载用户登录状态到ctx
const prevAuthCheck = async(ctx, next)=>{
    let authState = {
        state: false,
        username: null,
    }
    try{
        const session = ctx.cookies.get('session');
        const sessionArray = await sessionModel.find({session:session});
        if(sessionArray.length<1){
            //未匹配到相应的用户
            authState.state = false;
        }else{
            //匹配到了相应用户 封装用户名
            authState.state = true;
            authState.username = sessionArray[0]._doc.username;
        }
    }catch(err){
        console.log(err);
        authState.state = false;
    }

    //挂载到上下文
    ctx.authState = authState;

    await next();
};

module.exports = {
    prevAuthCheck:prevAuthCheck,
};