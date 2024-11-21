const express = require('express');
const multer = require('multer');
const csvParser = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

const db = new sqlite3.Database('./attendees.db');

// Initialize the database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS attendees (
        id INTEGER PRIMARY KEY, 
        name TEXT NOT NULL, 
        company TEXT NOT NULL, 
        email TEXT NOT NULL, 
        present INTEGER DEFAULT 0
    )`);
});

// Endpoint to handle CSV upload and save to the database
app.post('/upload-csv', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const attendees = [];
    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => {
            // Check for required fields
            if (row.name && row.company && row.email) {
                db.run(
                    "INSERT INTO attendees (name, company, email, present) VALUES (?, ?, ?, ?)",
                    [row.name, row.company, row.email, 0],
                    (err) => {
                        if (err) console.error('Database error:', err);
                    }
                );
                attendees.push({ name: row.name, company: row.company, email: row.email, present: false });
            }
        })
        .on('end', () => {
            fs.unlinkSync(filePath); // Delete the uploaded file
            res.json({ attendees });
        })
        .on('error', (error) => {
            console.error('Error processing CSV:', error);
            res.status(500).send('Error processing CSV file.');
        });
});

// Endpoint to download the updated CSV
app.get('/download-csv', (req, res) => {
    db.all("SELECT * FROM attendees", [], (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Error retrieving data.');
        }

        // Generate CSV content
        let csvContent = 'Name,Company,Email,Present\n';
        rows.forEach(row => {
            csvContent += `${row.name},${row.company},${row.email},${row.present ? 'Yes' : 'No'}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('updated_attendees.csv');
        res.send(csvContent);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Server error occurred.');
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
