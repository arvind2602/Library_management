import express from 'express';
import pool from '../utils/db.js';
import Joi from 'joi';

const AuthRouter = express.Router();

AuthRouter.post('/register', async (req, res) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(255).required(),
        password: Joi.string().min(4).max(255).required(),
        role: Joi.string().min(3).max(255).required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json(error.details[0].message);
    }

    try {
        const { username, password, role } = req.body;
        const newUser = await pool.query(
            "INSERT INTO users (username, password,role) VALUES ($1, $2, $3) RETURNING *",
            [username, password, role]
        );
        res.json(newUser.rows[0]);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json('Server Error');
    }
}
);


// Login route
AuthRouter.post('/login', async (req, res) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(255).required(),
        password: Joi.string().min(4).max(255).required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json(error.details[0].message);
    }

    // Check if user exists
    const userExist = await pool.query("SELECT * FROM users WHERE username = $1", [req.body.username]);
    if (userExist.rows.length === 0) {
        return res.status(401).json('User does not exist');
    }

    try {
        const { username, password } = req.body;
        const user = await pool.query("SELECT * FROM users WHERE username = $1 AND password = $2", [username, password]);
        if (user.rows.length === 0) {
            return res.status(401).json('Invalid Credential');
        }
        res.json(user.rows[0]);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json('Server Error');
    }
});

export default AuthRouter;