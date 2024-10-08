import express from 'express';
import pool from '../utils/db.js';
import Joi from 'joi';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import verifyToken from '../utils/verifytoken.js';

const AuthRouter = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const userSchema = Joi.object({
    username: Joi.string().min(3).max(255).required(),
    password: Joi.string().min(4).max(255).required(),
    role: Joi.string().min(3).max(255).required(),
});

// Generate JWT
const generateToken = (user) => {
    return jwt.sign({ userId: user.user_id, username: user.username, role: user.role }, JWT_SECRET, {
        expiresIn: '1h', // Token expires in 1 hour
    });
};

// Register route
AuthRouter.post('/register', async (req, res) => {
    const { error } = userSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { username, password, role } = req.body;

    try {
        // Check if the user already exists
        const userExist = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (userExist.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user
        const newUser = await pool.query(
            "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *",
            [username, hashedPassword, role]
        );

        res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
});

// Login route
AuthRouter.post('/login', async (req, res) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(255).required(),
        password: Joi.string().min(4).max(255).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    const { username, password } = req.body;

    try {
        // Check if user exists
        const userExist = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        if (userExist.rows.length === 0) {
            return res.status(401).json({ error: 'User does not exist' });
        }

        const user = userExist.rows[0];

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = generateToken(user);

        res.json({ message: 'Login successful', token, user: { user_id: user.user_id, role: user.role } });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
});


// Delete a user if role is Member
AuthRouter.delete('/:user_id', verifyToken, async (req, res) => {
    const userId = parseInt(req.params.user_id, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        // Check if user exists and is a member
        const userExist = await pool.query("SELECT * FROM users WHERE user_id = $1 AND role = $2", [userId, 'Member']);
        if (userExist.rows.length === 0) {
            return res.status(404).json({ error: 'User does not exist or is not a member' });
        }

        // Delete the user
        const deleteUser = await pool.query("DELETE FROM users WHERE user_id = $1 RETURNING *", [userId]);
        res.status(200).json({ message: 'User deleted successfully', user: deleteUser.rows[0] });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
});

// List all the members
AuthRouter.get('/', verifyToken, async (req, res) => {
    try {
        const allUsers = await pool.query("SELECT * FROM users WHERE role='Member'");
        res.status(200).json(allUsers.rows);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
});

// Update a user
AuthRouter.put('/:user_id', verifyToken, async (req, res) => {
    const userId = parseInt(req.params.user_id, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { error } = userSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        // Check if user exists
        const userExist = await pool.query("SELECT * FROM users WHERE user_id = $1", [userId]);
        if (userExist.rows.length === 0) {
            return res.status(404).json({ error: 'User does not exist' });
        }

        const { username, role } = req.body; // Only destructure username and role

        // Update the user without touching the password
        await pool.query(
            "UPDATE users SET username = $1, role = $2 WHERE user_id = $3 RETURNING *",
            [username, role, userId]
        );

        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
});


export default AuthRouter;
