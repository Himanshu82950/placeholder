const jwt =require('jsonwebtoken')
const secretKey=process.env.secretKey;


const jwtauthMiddleware=(req,res,next)=>{
    const authorization=req.headers.authorization
    if(!authorization){
        res.status(400).send({
            success:false,
            message:"token not found"
        })
    }

const token=authorization.split(' ')[1];
if(!token){
     res.status(401).json({
        error:"unauthorized"
    })
}

    try {
       
        let decoded=jwt.verify(token,secretKey);
        req.newUser=decoded;
        
        next();
    } catch (error) {
        console.error(error);
    res.status(401).json({
       error:"invalid token"
        
    })
    }
}



const generateToken=(newUser)=>{
    return jwt.sign(newUser,secretKey,{expiresIn:3000})
}
module.exports={jwtauthMiddleware,generateToken};