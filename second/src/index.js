// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
    path:'./env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT|| 8000,()=>{
        console.log("server is running port :",process.env.PORT || 8000)
    })
})
.catch((err)=>{
    console.log( "mongo db connect fail",err);
})






















/*
(async ()=>{
    try {
         await mongoose.connect(`${proccess.env.MONGODB_URI}/${DB_NAME}`)
         app.on("error",(error)=>{
            console.log(error)
         })

         app.listen(process.env.PORT,()=>{
            console.log(`${process.env.PORT}`)
         })
    } catch (error) {
        console.log("error",error)
        throw error
    }
})()
*/