const express=require('express');
const cors=require('cors');
const authRotes=require('./routes/authRoutes');
const protectedRoutes=require('./routes/protectedRoutes');
require('dotenv').config();

const app=express();
const port=5000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

app.use('/api',authRotes);
app.use('/api',protectedRoutes);

app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
})
