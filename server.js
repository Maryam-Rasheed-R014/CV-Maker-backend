import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import DBconnection from './config/db.js'; 
import userRoutes from './routes/users.route.js';
import passport from 'passport';
import googleStrategy from 'passport-google-oauth20';


dotenv.config();

const app = express();
const PORT =  5000;
DBconnection();
// Middleware

app.use(cors());
app.use(express.json());   

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Server is running');
});
app.use('/auth', userRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 

