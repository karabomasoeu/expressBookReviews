const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;

const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

// Register a new user
public_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
    }

    if (isValid(username)) {
        return res.status(409).json({ message: "Username already exists" });
    }

    users.push({ username, password });
    return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Get all books
public_users.get('/', (req, res) => {
    return res.status(200).send(JSON.stringify(books, null, 4));
});

// Get book details by ISBN
public_users.get('/isbn/:isbn', (req, res) => {
    const isbn = req.params.isbn;
    if (books[isbn]) {
        return res.status(200).json(books[isbn]);
    } else {
        return res.status(404).json({ message: "Book not found" });
    }
});

// Get books by author
public_users.get('/author/:author', (req, res) => {
    const author = req.params.author.toLowerCase();
    const result = Object.keys(books)
        .filter(isbn => books[isbn].author.toLowerCase() === author)
        .map(isbn => ({ isbn, ...books[isbn] }));

    if (result.length > 0) {
        return res.status(200).json({ booksbyauthor: result });
    } else {
        return res.status(404).json({ message: "No books found by this author" });
    }
});

// Get books by title 
public_users.get('/title/:title', (req, res) => {
    const title = req.params.title.toLowerCase();
    const result = Object.keys(books)
        .filter(isbn => books[isbn].title.toLowerCase() === title)
        .map(isbn => ({ isbn, ...books[isbn] }));

    if (result.length > 0) {
        return res.status(200).json({ booksbytitle: result });
    } else {
        return res.status(404).json({ message: "No books found with this title" });
    }
});

// Get book review by ISBN
public_users.get('/review/:isbn', (req, res) => {
    const isbn = req.params.isbn;
    if (books[isbn] && books[isbn].reviews) {
        return res.status(200).json(books[isbn].reviews);
    } else {
        return res.status(404).json({ message: "No reviews found" });
    }
});

// get all books 
const getAllBooks = async () => {
    const response = await axios.get(`${BASE_URL}/`);
    return response.data;
};

// Method 2: get book by ISBN 
const getBookByISBN = (isbn) => {
    return axios.get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`)
        .then(response => response.data);
};

// Method 3: get books by author (async/await)
const getBooksByAuthor = async (author) => {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
};

// get books by title (Promise)
const getBooksByTitle = (title) => {
    return axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`)
        .then(response => response.data);
};

// Pass Axios errors back to the client
const handleError = (res, err) => {
    const status = err.response ? err.response.status : 500;
    const body = err.response ? err.response.data : { message: err.message };
    return res.status(status).json(body);
};

// Routes that call the Axios methods above
public_users.get('/async/books', async (req, res) => {
    try {
        return res.status(200).json(await getAllBooks());
    } catch (err) {
        return handleError(res, err);
    }
});

public_users.get('/async/isbn/:isbn', (req, res) => {
    getBookByISBN(req.params.isbn)
        .then(data => res.status(200).json(data))
        .catch(err => handleError(res, err));
});

public_users.get('/async/author/:author', async (req, res) => {
    try {
        return res.status(200).json(await getBooksByAuthor(req.params.author));
    } catch (err) {
        return handleError(res, err);
    }
});

public_users.get('/async/title/:title', (req, res) => {
    getBooksByTitle(req.params.title)
        .then(data => res.status(200).json(data))
        .catch(err => handleError(res, err));
});

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
