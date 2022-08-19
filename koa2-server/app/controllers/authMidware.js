const {userModel, sessionModel} = require('../models/UserInfo.js');
// const data = require('../../source/test/kdata.js');
const {nanoid} = require('nanoid'); 

//上下文权限验证
const auth = async(ctx, next)=>{
    let retObj = {
        state: false,
        username: null,
    }
    
    await next();

    retObj = ctx.authState;
    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//登录
const login = async(ctx , next)=>{
    const reqBody = ctx.request.body;
    console.log('request login ', reqBody.username, reqBody.password);
    const {username, password} = reqBody;

    await next();

    let retObj = {
        msg: "用户名或密码错误",
        state:false,
    };
    try{
        const userArray = await userModel.find({username:username});
        if(userArray.length<1){
            //查询用户 如果用户不存在则错误
            retObj.msg="用户名或密码错误",
            retObj.state=false;
        }else{
            const {_doc} = userArray[0];
            //匹配密码 
            if(_doc.username === username && _doc.password === password){
                //查询session是否存在
                const sessionString = nanoid();
                console.log(sessionString);
                const sessionArray = await sessionModel.find({username:username});
                if(sessionArray.length<1){
                    //若不存在 新建
                    const session = new sessionModel({
                        username:username,
                        session:sessionString,
                    });
                    await session.save();
                }else{
                    //若存在 更新
                    await sessionModel.updateOne({
                        username:username
                    },{
                        username:username,
                        session:sessionString
                    });
                }
                //登录成功 设置浏览器cookie
                ctx.cookies.set('session',sessionString);
                retObj.msg="登录成功",
                retObj.state=true;
            }else{
                retObj.msg="用户名或密码错误",
                retObj.state=false;
            }
        }
        
    }catch(err){
        console.log(err);
    }

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//注册
const register = async(ctx, next)=>{
    const reqBody = ctx.request.body;
    console.log('request register ', reqBody.username, reqBody.password);
    const {username, password} = reqBody;

    await next();

    let retObj = {
        state: false,
        msg: '未知错误'
    };

    //检查用户是否已存在
    try{
        const userArray = await userModel.find({ username: username });
        if(userArray.length>0){
            //不能存在同名用户
            retObj.state = false;
            retObj.msg = "该用户已存在";
        }else{
            //进行注册
            const user = new userModel({
                username: username,
                password: password,
            });
            await user.save();
            retObj.state = true;
            retObj.msg = "注册成功";
        }
    }catch(err){
        console.log(err);
    }
    
    ctx.response.type = "application/json";
    ctx.response.body = retObj;
}

//注销
const unregister = async(ctx, next)=>{
    console.log('request unregister');
    let retObj = {
        state: false
    }
    const sessionString = ctx.cookies.get('session');

    await next();
    
    try{
        const sessionArray = await sessionModel.find({session:sessionString});
        if(sessionArray.length<1){
            //未通过session找到用户 可能是在其他地方登录了
            //但还是可以注销
            retObj.state = true;
        }else{
            //能找到用户 清空数据库session
            await sessionModel.updateOne(
                {session: sessionArray[0]._doc.session},
                {
                    username: sessionArray[0]._doc.username,
                    session: ''
                }
            );
            retObj.state = true;
        }
        //只要注销 清空浏览器cookie
        ctx.cookies.set('session', '');
    }catch(err){
        retObj.state = false;
    }

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//修改密码
const setpwd = async(ctx, next)=>{
    const reqBody = ctx.request.body;
    console.log('set pwd',reqBody);
    let retObj = {
        state: true,
        msg:"",
    }
    await next();
    //首先检查登录状态
    if(ctx.authState.state === false ){
        retObj.state = false;
        retObj.msg="用户未处于登录状态"
    }
    //检查旧密码是否匹配
    //修改为新密码
    //注销
    ctx.response.type = "application/json";
    ctx.response.body = retObj;
    
};

module.exports={
    auth:auth,
    login:login,
    register:register,
    unregister:unregister,
    setpwd:setpwd,
};