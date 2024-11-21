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
    db.run("CREATE TABLE IF NOT EXISTS attendees (id INTEGER PRIMARY KEY, name TEXT, company TEXT, email TEXT, present INTEGER)");
});

// Endpoint to handle CSV upload and save to database
app.post('/upload-csv', upload.single('file'), (req, res) => {
    const attendees = [];
    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => {
            const {name, company, email } = row;
            db.run("INSERT INTO attendees (name, company, email, present) VALUES (?, ?, ?, ?, ?)", [name, company, email, 0]);
            attendees.push({ name, company, email, present: false });
        })
        .on('end', () => {
            fs.unlinkSync(filePath); // Delete the uploaded file
            res.json({ attendees });
        });
});

// Endpoint to download the updated CSV
app.get('/download-csv', (req, res) => {
    db.all("SELECT * FROM attendees", [], (err, rows) => {
        if (err) {
            throw err;
        }

        let csvContent = 'Name,Company,Email,Present\n';
        rows.forEach(row => {
            csvContent += `${row.name},${row.company},${row.email},${row.present ? 'Yes' : 'No'}\n`;
        });

        res.header('Content-Type', 'text/csv');
        res.attachment('updated_attendees.csv');
        res.send(csvContent);
    });
});

// Start the server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
