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
    db.run("CREATE TABLE IF NOT EXISTS attendees (id INTEGER PRIMARY KEY, last_name TEXT, first_name TEXT, company TEXT, email TEXT, present INTEGER)");
});

// Endpoint to handle CSV upload and save to database
app.post('/upload-csv', upload.single('file'), (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    const attendees = [];
    fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (row) => {
            const { last_name, firstname, company, email } = row;
            attendees.push({ last_name, first_name, company, email, present: 0 });

            // Insert each row into the database
            db.run(
                "INSERT INTO attendees (last_name, first_name, company, email, present) VALUES (?, ?, ?, ?, ?)",
                [last_name, first_name, company, email, 0],
                (err) => {
                    if (err) {
                        console.error('Error inserting row:', err);
                    }
                }
            );
        })
        .on('end', () => {
            fs.unlinkSync(filePath); // Delete the uploaded file
            res.json({ message: "CSV uploaded and processed successfully", attendees });
        })
        .on('error', (error) => {
            console.error('Error reading CSV:', error);
            res.status(500).send('Error processing CSV file');
        });
});

// Endpoint to download the updated CSV
app.get('/download-csv', (req, res) => {
    db.all("SELECT * FROM attendees", [], (err, rows) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).send('Error retrieving attendees');
        }

        // Generate CSV content with combined Name column
        let csvContent = 'Name,Company,Email,Present\n';
        rows.forEach(row => {
            const name = `${row.first_name} ${row.last_name}`; // Combine first_name and last_name
            csvContent += `${name},${row.company},${row.email},${row.present ? 'Yes' : 'No'}\n`;
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
