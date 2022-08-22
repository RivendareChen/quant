// const data = require('../../source/test/kdata.js');
// const {nanoid} = require('nanoid'); 
const {starModel} = require('../models/StarInfo.js');

//初始化收藏夹
const initstar = async(ctx, next)=>{
    console.log('init star '+ctx.authState.username);
    let retObj = {
        total:{
            name:'全部股票',
            children:[],
        },
        folders:[],
    };
    if(ctx.authState.state === true){
        try{
            const starArray = await starModel.find({username:ctx.authState.username});
            if(starArray.length<1){
                throw new Error('Star Collection Row not found!');
            }
            else{
                const {_doc} = starArray[0];
                retObj = {
                    total:{
                        name:'全部股票',
                        children:_doc.total,
                    },
                    folders:_doc.folders,
                }
            }
        }
        catch(err){
            console.log(err);
        }
    }
    
    await next();

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//股票收藏or取消收藏
const star = async(ctx, next)=>{
    //仅发送收藏股票的代码 忽略收藏或者取消收藏
    //当股票收藏集合中无该股票时 认为是收藏股票
    //当股票收藏集合中有该股票时 认为是取消收藏
    const reqBody = ctx.request.body;
    console.log('star '+reqBody.code);
    let retObj = {
        success: false,
        state: ctx.authState.state,
    }

    if(retObj.state === true){
        try{
            const starArray = await starModel.find({username:ctx.authState.username});
            if(starArray.length<1){
                throw new Error('Star Collection Row not found!');
            }
            else{
                const {_doc} = starArray[0];
                const starIndex = _doc.total.findIndex((item)=>{
                    return item === reqBody.code;
                });
                if(starIndex<0){
                    //当股票收藏集合中无该股票时 认为是收藏股票
                    _doc.total.push(reqBody.code);
                }
                else{
                    //当股票收藏集合中有该股票时 认为是取消收藏
                    _doc.total.splice(starIndex,1);
                    //同时删除集合中自定义收藏夹中的该股票 todo
                    _doc.folders = _doc.folders.map((item)=>{
                        const currCodeIndex = item.children.findIndex((currCode)=>{
                            return currCode === reqBody.code;
                        });
                        if(currCodeIndex>=0){
                            item.children.splice(currCodeIndex,1);
                        }
                        return item;
                    });
                }
                await starModel.updateOne({username:ctx.authState.username},_doc);
                retObj.success = true;
            }
        }
        catch(err){
            console.log(err);
        }
    }

    await next();

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//新建股票收藏夹
const createfolder = async(ctx, next)=>{
    const reqBody = ctx.request.body;
    console.log(`add folder ${reqBody.name} to ${ctx.authState.username}`);

    let retObj = {
        success: false,
        msg: '服务器错误'
    }

    if(ctx.authState.state === true){
        try{
            const starArray = await starModel.find({username:ctx.authState.username});
            if(starArray.length<1){
                throw new Error('Star Collection Row not found!');
            }
            else{
                const {_doc} = starArray[0];
                const folderIndex = _doc.folders.findIndex((item)=>{
                    return item.name === reqBody.name;
                });
                if(folderIndex<0){
                    //未存同名收藏夹 直接添加并更新数据库
                    _doc.folders.push({name:reqBody.name,children:[]});
                    await starModel.updateOne({username:ctx.authState.username},_doc);
                    retObj = {
                        success:true,
                    }
                }
                else{
                    //存在同名收藏夹 报错
                    throw new Error('Exist Same Name folder there!');
                }
                
            }
        }
        catch(err){
            console.log(err);
            retObj = {
                success:false,
                msg:'服务器错误'
            }
        }
    }
    else{
        retObj = {
            success:false,
            msg:'用户未登录'
        }
    }


    await next();


    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//删除股票收藏夹
const removefolder = async(ctx, next)=>{
    const reqBody = ctx.request.body;
    console.log(`remove folder ${reqBody.name} from ${ctx.authState.username}`);
    
    let retObj = {
        success: false,
        msg: '服务器错误'
    }

    if(ctx.authState.state === true){
        try{
            const starArray = await starModel.find({username:ctx.authState.username});
            if(starArray.length<1){
                throw new Error('Star Collection Row not found!');
            }
            else{
                const {_doc} = starArray[0];
                const folderIndex = _doc.folders.findIndex((item)=>{
                    return item.name === reqBody.name;
                });
                if(folderIndex<0){
                    //收藏夹不存在 报错
                    throw new Error(`No folder ${reqBody.name} there!`);
                    
                }
                else{
                    //存在同名收藏夹 删除并更新数据库
                    _doc.folders.splice(folderIndex,1);
                    await starModel.updateOne({username:ctx.authState.username},_doc);
                    retObj = {
                        success:true,
                    }
                }
            }
        }
        catch(err){
            console.log(err);
            retObj = {
                success:false,
                msg:'服务器错误'
            }
        }
    }
    else{
        retObj = {
            success:false,
            msg:'用户未登录'
        }
    }

    await next();

    

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//从收藏夹移除股票
const removestar = async(ctx, next)=>{
    const {folder, code} = ctx.request.body;
    console.log(`remove ${code} from ${folder}`);
    
    let retObj = {
        success: false,
        msg: '服务器错误'
    }

    await next();

    if(ctx.authState.state === true){
        try{
            const starArray = await starModel.find({username:ctx.authState.username});
            if(starArray.length<1){
                throw new Error('Star Collection Row not found!');
            }
            else{
                const {_doc} = starArray[0];
                const starIndex = _doc.total.findIndex((item)=>{
                    return item === code;
                });
                if(starIndex<0){
                    //股票未收藏
                    throw new Error(`stock ${code} Not Star!`);
                }
                else{
                    const folderIndex = _doc.folders.findIndex((item)=>{
                        return item.name === folder;
                    });
                    if(folderIndex<0){
                        //不存在该文件夹
                        throw new Error(`folder ${folder} Not there!`);
                    }
                    else{
                        const subStarIndex = _doc.folders[folderIndex].children.findIndex((item)=>{
                            return item === code;
                        });
                        if(subStarIndex<0){
                            //股票还未加入该文件夹 报错 无法删除
                            throw new Error(`stock ${code} not in folder ${folder}!`);
                        }
                        else{
                            //股票已经加入该文件夹 删除 并更新数据库
                            _doc.folders[folderIndex].children.splice(subStarIndex,1);
                            await starModel.updateOne({username:ctx.authState.username},_doc);
                            retObj = {
                                success:true,
                            }
                        }
                    }
                }
            }
        }
        catch(err){
            console.log(err);
            retObj = {
                success:false,
                msg:'服务器错误'
            }
        }
    }
    else{
        retObj = {
            success:false,
            msg:'用户未登录'
        }
    }

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

//将股票加入收藏夹
const addstar = async(ctx, next)=>{
    const {folder, code} = ctx.request.body;
    console.log(`add ${code} to ${folder}`);
    
    let retObj = {
        success: false,
        msg: '服务器错误'
    }

    await next();

    if(ctx.authState.state === true){
        try{
            const starArray = await starModel.find({username:ctx.authState.username});
            if(starArray.length<1){
                throw new Error('Star Collection Row not found!');
            }
            else{
                const {_doc} = starArray[0];
                const starIndex = _doc.total.findIndex((item)=>{
                    return item === code;
                });
                if(starIndex<0){
                    //股票未收藏
                    throw new Error(`stock ${code} Not Star!`);
                }
                else{
                    const folderIndex = _doc.folders.findIndex((item)=>{
                        return item.name === folder;
                    });
                    if(folderIndex<0){
                        //不存在该文件夹
                        throw new Error(`folder ${folder} Not there!`);
                    }
                    else{
                        const subStarIndex = _doc.folders[folderIndex].children.findIndex((item)=>{
                            return item === code;
                        });
                        if(subStarIndex<0){
                            //股票还未加入该文件夹 加入 并更新数据库
                            _doc.folders[folderIndex].children.push(code);
                            await starModel.updateOne({username:ctx.authState.username},_doc);
                            retObj = {
                                success:true,
                            }
                        }
                        else{
                            throw new Error(`stock ${code} has been in folder ${folder}!`);
                        }
                    }
                }
            }
        }
        catch(err){
            console.log(err);
            retObj = {
                success:false,
                msg:'服务器错误'
            }
        }
    }
    else{
        retObj = {
            success:false,
            msg:'用户未登录'
        }
    }

    ctx.response.type = "application/json";
    ctx.response.body = retObj;
};

module.exports = {
    initstar:initstar,
    star:star,
    createfolder:createfolder,
    removefolder:removefolder,
    removestar:removestar,
    addstar:addstar,
};