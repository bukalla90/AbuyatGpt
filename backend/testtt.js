import express from "express"

const app=express();
// app.use(express.json());

function logger(req,res,next){
    const url=req.url
    const method=req.method
    console.log(url,method)
   
    next()
}
app.use(logger) 
app.get("/",logger,(req,res)=>{
    
    res.send("hello abuyatgpt")
})
app.get("/about",logger,(req,res)=>{
    
    res.send("hello abuyatgpt from about")
})

app.get("/api/chat",logger,(req,res)=>{
    res.send("hello abuyatgpt from chat")
})
app.get("/api/conversation",logger,(req,res)=>{
    res.send("hello abuyatgpt from conversation route")
})







app.listen(3888,()=>{
    console.log("server is running on port 3888")
})