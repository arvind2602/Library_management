import express from 'express';
import Joi from 'joi';
import pool from '../utils/db.js';

const BooksRouter = express.Router();

BooksRouter.post('/', async (req, res) => {
    const schema = Joi.object({
        title: Joi.string().min(3).max(255).required(),
        author: Joi.string().min(3).max(255).required(),
        isbn: Joi.string().min(3).max(255).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    // Check if book already exists
    const bookExist = await pool.query("SELECT * FROM books WHERE isbn = $1 AND title=$2", [req.body.isbn, req.body.title]);
    if (bookExist.rows.length > 0) {
        return res.status(400).json({ error: 'Book already exists' });
    }

    try {
        const { title, author, isbn } = req.body;
        const newBook = await pool.query(
            "INSERT INTO books (title, author, isbn) VALUES ($1, $2, $3) RETURNING *",
            [title, author, isbn]
        );

        res.status(201).json({ message: 'Book added successfully', book: newBook.rows[0] });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }

}
);


// List all books
BooksRouter.get('/', async (req, res) => {
    try {
        const allBooks = await pool.query("SELECT * FROM books");
        res.status(200).json(allBooks.rows);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
});

// Delete a book
BooksRouter.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleteBook = await pool.query("DELETE FROM books WHERE id = $1 RETURNING *", [id]);
        if (deleteBook.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.status(200).json({ message: 'Book deleted successfully', book: deleteBook.rows[0] });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
});


// Update a book
BooksRouter.put('/:id', async (req, res) => {
    const schema = Joi.object({
        title: Joi.string().min(3).max(255).required(),
        author: Joi.string().min(3).max(255).required(),
        isbn: Joi.string().min(3).max(255).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    try {
        const { id } = req.params;
        const { title, author, isbn } = req.body;
        const updateBook = await pool.query(
            "UPDATE books SET title = $1, author = $2, isbn = $3 WHERE id = $4 RETURNING *",
            [title, author, isbn, id]
        );
        if (updateBook.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        res.status(200).json({ message: 'Book updated successfully', book: updateBook.rows[0] });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
}
);
export default BooksRouter;