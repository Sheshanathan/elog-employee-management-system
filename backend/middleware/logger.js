function logger(req,res,next){
    console.log("Method:",req.method);
    console.log("URL:",req.url);
    console.log("Time:",new Date().toLocaleString());
    next();
}
module.exports=logger;