const fs = require('fs');
const path = require('path');

const dataDir = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const getFilePath = (filename) => path.join(dataDir, filename);

const readData = (filename) => {
    try {
        const filePath = getFilePath(filename);
        if (!fs.existsSync(filePath)) {
            // Return empty array for users, empty object for others
            if (filename === 'users.json') return [];
            return {};
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        // Return appropriate default based on filename
        if (filename === 'users.json') return [];
        return {};
    }
};

const writeData = (filename, data) => {
    try {
        const filePath = getFilePath(filename);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        return false;
    }
};

module.exports = { readData, writeData };