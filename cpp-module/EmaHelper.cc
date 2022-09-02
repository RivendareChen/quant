#include <napi.h>
#include <iostream>

using namespace std;

Napi::Value Test(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env(); 

    Napi::Array arr = info[0].As<Napi::Array>();
    size_t len = arr.Length();

    for(size_t i=0; i<len; ++i){
        double curr = arr.Get(static_cast<napi_value>(Napi::Number::New(env,i))).As<Napi::Number>();
        arr.Set(Napi::Number::New(env,i),Napi::Number::New(env,curr*curr));
    }

    return arr;
}

Napi::Value Sum(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env(); 


    size_t len = info[0].As<Napi::Number>().Uint32Value();
    long long sum = 0;
    for(size_t i=0; i<len; ++i){
        double curr = (i%100)*(i%100)*0.1;
        sum += curr;
    }
    return Napi::Number::New(env, sum);
}

Napi::Value EMA12(const Napi::CallbackInfo& info){

    Napi::Env env = info.Env();
    const double curr = info[0].As<Napi::Number>().DoubleValue();
    const double prev = info[1].As<Napi::Number>().DoubleValue();

    const double a = 0.153846;
    const double b = 0.84615;

    return Napi::Number::New(env, a*curr+b*prev);
}

Napi::Value EMA26(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    double curr = info[0].As<Napi::Number>().DoubleValue();
    double prev = info[1].As<Napi::Number>().DoubleValue();

    const double a = 0.074074 ;
    const double b = 0.925926;

    return Napi::Number::New(env, a*curr+b*prev);
}

Napi::Value EMA9(const Napi::CallbackInfo& info){
    Napi::Env env = info.Env();
    double curr = info[0].As<Napi::Number>().DoubleValue();
    double prev = info[1].As<Napi::Number>().DoubleValue();

    const float a = 0.2;
    const float b = 0.8;
    return Napi::Number::New(env, a*curr+b*prev);
}

Napi::Object Init(Napi::Env env, Napi::Object exports){
    exports.Set(Napi::String::New(env,"test"),Napi::Function::New(env,Test));
    exports.Set(Napi::String::New(env,"sum"),Napi::Function::New(env,Sum));
    exports.Set(Napi::String::New(env,"ema12"),Napi::Function::New(env,EMA12));
    exports.Set(Napi::String::New(env,"ema26"),Napi::Function::New(env,EMA26));
    exports.Set(Napi::String::New(env,"ema9"),Napi::Function::New(env,EMA9));
    return exports;
}

NODE_API_MODULE(addon,Init)