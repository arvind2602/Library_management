import express from 'express';
import pool from '../utils/db.js';
import Joi from 'joi';
import bcrypt from 'bcrypt';

const AuthRouter = express.Router();

AuthRouter.post('/register', async (req, res) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(255).required(),
        password: Joi.string().min(4).max(255).required(),
        role: Joi.string().min(3).max(255).required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const { username, password, role } = req.body;

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            "INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING *",
            [username, hashedPassword, role]
        );

        // Consistent response structure
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
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
});


// Delete a user if role is member
AuthRouter.delete('/:user_id', async (req, res) => {

    // Check if user exists
    const userExist = await pool.query("SELECT * FROM users WHERE user_id = $1 AND role = $2", [req.params.user_id, 'Member']);
    if (userExist.rows.length === 0) {
        return res.status(404).json({ error: 'User does not exist' });
    }
    try {
        const { user_id } = req.params;
        const deleteUser = await pool.query("DELETE FROM users WHERE user_id = $1 RETURNING *", [user_id]);
        if (deleteUser.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully', user: deleteUser.rows[0] });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
});


// List all the members
AuthRouter.get('/', async (req, res) => {
    try {
        const allUsers = await pool.query("SELECT * FROM users WHERE role='Member'");
        res.status(200).json(allUsers.rows);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
});


// Update a user
AuthRouter.put('/:user_id', async (req, res) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(255).required(),
        password: Joi.string().min(4).max(255).required(),
        role: Joi.string().min(3).max(255).required()
    });
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    // Check if user exists
    const userExist = await pool.query("SELECT * FROM users WHERE user_id = $1", [req.params.user_id]);
    if (userExist.rows.length === 0) {
        return res.status(404).json({ error: 'User does not exist' });
    }

    try {
        const { username, password, role } = req.body;
        const updateUser = await pool.query(
            "UPDATE users SET username=$1, password=$2, role=$3 WHERE user_id = $4 RETURNING *",
            [username, password, role, req.params.user_id]
        );
        res.status(200).json({ message: 'User updated successfully', user: updateUser.rows[0] });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
});

export default AuthRouter;