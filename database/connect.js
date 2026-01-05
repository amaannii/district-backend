import mongoose from "mongoose"
import dotenv, { config } from "dotenv"

dotenv.config()

const connected=mongoose.connect(process.env.MONGO_URL).then(()=>{
    console.log("database is connected succefully");
    
}).catch((err)=>{
console.log(err);

})

export default connected