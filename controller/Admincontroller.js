

const adminemail="admin@gmail.com"
const adminpassword="admin123"


const adminlogin=(req,res)=>{
const {email,password}=req.body
if(email===adminemail&&password===adminpassword){
    res.json({success:true})
}else{
     res.json({success:false})
}
}


export{
    adminlogin,
}