import express from 'express';
import Joi from 'joi';
import pool from '../utils/db.js';
import verifyToken from '../utils/verifytoken.js';

const BooksRouter = express.Router();

BooksRouter.post('/', verifyToken, async (req, res) => {
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
BooksRouter.get('/', verifyToken, async (req, res) => {
    try {
        const allBooks = await pool.query("SELECT * FROM books");
        res.status(200).json(allBooks.rows);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
});

// Delete a book
BooksRouter.delete('/:id', verifyToken, async (req, res) => {
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
BooksRouter.put('/:id', verifyToken, async (req, res) => {
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



// Borrow Book
BooksRouter.post('/borrow/:id/:user_id', verifyToken, async (req, res) => {
    try {
        const { id, user_id } = req.params;

        // Check if book status is available
        const bookExist = await pool.query("SELECT * FROM books WHERE id = $1 AND status = 'available'", [id]);
        if (bookExist.rows.length === 0) {
            return res.status(400).json({ error: 'Book not available for borrowing' });
        }

        // Update the status of the book
        const book = await pool.query("UPDATE books SET status = 'borrowed', bought_by_id = $2 WHERE id = $1 RETURNING *", [id, user_id]);

        const borrowBook = await pool.query(
            "INSERT INTO borrower (book_id, user_id) VALUES ($1, $2) RETURNING *",
            [id, user_id]
        );

        res.status(201).json({ message: 'Book borrowed successfully', borrowed_book: borrowBook.rows[0] });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
});


// Return Book
BooksRouter.post('/return/:id/:user_id', verifyToken, async (req, res) => {
    try {
        const { id, user_id } = req.params;

        // Check if the book is currently borrowed by the user
        const borrowRecord = await pool.query(
            "SELECT * FROM borrower WHERE book_id = $1 AND user_id = $2",
            [id, user_id]
        );

        if (borrowRecord.rows.length === 0) {
            return res.status(400).json({ error: 'No record of this book being borrowed by the user' });
        }

        // Update the status of the book to available
        await pool.query("UPDATE books SET status = 'available' WHERE id = $1", [id]);

        const retrun_date = new Date();
        await pool.query("UPDATE borrower SET returned=$3  WHERE book_id = $1 AND user_id = $2", [id, user_id, retrun_date]);

        res.status(200).json({ message: 'Book returned successfully' });
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
});



// Get the list of book by books status
BooksRouter.get('/status/:status/:bought_by_id', verifyToken, async (req, res) => {
    try {
        const { status, bought_by_id } = req.params;
        const allBooks = await pool.query("SELECT * FROM books WHERE status = $1 AND bought_by_id=$2", [status, bought_by_id]);
        res.status(200).json(allBooks.rows);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
}
);


// Check the list of books borrowed by a user
BooksRouter.get('/borrowed/:user_id', verifyToken, async (req, res) => {
    try {
        const { user_id } = req.params;
        const allBooks = await pool.query("SELECT * FROM borrower WHERE user_id = $1", [user_id]);
        res.status(200).json(allBooks.rows);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server Error', details: error.message });
    }
}
);
export default BooksRouter;