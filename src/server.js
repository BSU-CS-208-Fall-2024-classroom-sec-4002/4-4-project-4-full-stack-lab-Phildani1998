// Import required modules
import express from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper code to make __dirname work in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const db = new sqlite3.Database(':memory:'); // Use an in-memory SQLite database

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, '../public')));

// Set up views directory and view engine
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'pug');

// Middleware to parse URL-encoded form data
app.use(express.urlencoded({ extended: false }));

// Create a "todo" table in the database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS todo (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task TEXT NOT NULL
    )`);
});

// Define root route to render the main page
app.get('/', (req, res) => {
    const tasks = [];
    db.each('SELECT id, task FROM todo', (err, row) => {
        if (err) {
            console.error(err.message);
        } else {
            tasks.push({ id: row.id, task: row.task });
        }
    }, () => {
        res.render('index', { tasks });
    });
});

// Define the /add route to handle task addition
app.post('/add', (req, res) => {
    const task = req.body.todo.trim();
    if (task) {
        const stmt = db.prepare('INSERT INTO todo (task) VALUES (?)');
        stmt.run(task, (err) => {
            if (err) {
                console.error(err.message);
            }
            stmt.finalize();
            res.redirect('/');
        });
    } else {
        res.redirect('/');
    }
});

// Define the /delete route to handle task deletion
app.post('/delete', (req, res) => {
    const taskId = req.body.id;
    const stmt = db.prepare('DELETE FROM todo WHERE id = ?');
    stmt.run(taskId, (err) => {
        if (err) {
            console.error(err.message);
        }
        stmt.finalize();
        res.redirect('/');
    });
});

// Starts server
app.listen(3000, () => {
    console.log('Listening on port 3000...');
});