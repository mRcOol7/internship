const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// CORS Configuration
const allowedOrigins = [
    'http://localhost:3000',
    'https://internship-esg.vercel.app',
    'https://backend-sigma-orpin.vercel.app',
    'http://localhost:5000'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
            
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error('CORS Error - Origin not allowed:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/favicon.png', (req, res) => res.status(204).end());
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/', (req, res) => res.send('Hello, Vercel!'));

app.use('/api', authRoutes);
app.use('/api', protectedRoutes);

app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        },
    });
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = app;
