const express=require('express');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const mysql=require('mysql2/promise');
const cors=require('cors');
require('dotenv').config();
const app=express();
const port=5000;

app.use(express.json());
app.use(cors());

const db=mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT),
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT)
});

db.getConnection().then((connection)=>{
    console.log('Database connected');
    connection.release();
}).catch((error)=>{
    console.log(error);
});

app.post('/api/signup',async(req,res)=>{
    const {email,password}=req.body;
    try{
        const hashedPassword=await bcrypt.hash(password,10);
        const [rows]=await db.query('INSERT INTO users(email,password) VALUES(?,?)',[email,hashedPassword]);
        res.status(201).json({message:'Signup successful'});
    }catch(error){
        res.status(500).json({error:error.message});
    }
});

app.post('/api/login',async(req,res)=>{
    const {email,password}=req.body;
    try{
        const [rows]=await db.query('SELECT * FROM users WHERE email=?',[email]);
        if(rows.length===0){
            res.status(401).json({message:'User not found'});
        }else{
            const isPasswordValid=await bcrypt.compare(password,rows[0].password);
            if(isPasswordValid){
                const token=jwt.sign({id:rows[0].id},'secret');
                res.status(200).json({token});
            }else{
                res.status(401).json({message:'Invalid password'});
            }
        }
    }catch(error){
        res.status(500).json({error:error.message});
    }
});

app.post('/api/protected',async(req,res)=>{
    const token=req.headers['authorization'];
    if(!token){
        res.status(401).send({message:'Unauthorized'});
    }
    jwt.verify(token,'secret',async(err,decoded)=>{
        if(err){
            return res.status(401).send({message:'Unauthorized'});
        }
        res.status(200).send({message:'Protected route',userId:decoded.id});
    });
});

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})