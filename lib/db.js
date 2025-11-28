import mysql from 'mysql2/promise';

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'travelsite',
    port: 3306
};

export async function query({ query, values = [] }) {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [results] = await connection.execute(query, values);
        await connection.end();
        return results;
    } catch (error) {
        throw Error(error.message);
    }
}