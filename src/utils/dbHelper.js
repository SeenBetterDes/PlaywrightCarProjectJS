const mysql = require('mysql2/promise')
require("dotenv").config()


const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function insertUsers(user) {
    await db.query('DELETE FROM users WHERE username = ?', [user.username]);
    const [result] = await db.query(
        'INSERT INTO users (username, first_name, last_name, password) VALUES (?, ?, ?, ?)',
        [user.username, user.first_name, user.last_name, user.password]
    );
    return result.insertId;
}


async function getLatestUser() {
    const [rows] = await db.query('SELECT * FROM users ORDER BY id DESC LIMIT 1');
    return rows[0]; 
}

function generateTestUser() {
    const timeStamp = Date.now();
    return {
        username: `TestUser_${timeStamp}_${Math.floor(Math.random() * 1000)}`,
        first_name: 'Test',
        last_name: 'User',
        password: `Password!_${timeStamp}!`,
    };
}

async function updateUserFirstName(username, newFirstName) {
  await db.query('UPDATE users SET first_name = ? WHERE username = ?', [newFirstName, username]);

}

async function updatedPassword(password,newPassword){
    await db.query('UPDATE users SET password =? WHERE password = ?',[newPassword,password])
}

async function registerUserViaUI(page, user, registerPage) {
    await registerPage.goMainPage();
    await registerPage.goRegisterPage();
    await registerPage.registerValidUser(
        user.username,
        user.first_name,
        user.last_name,
        user.password,
        user.password
    );
    await registerPage.registerButton.click()
}



async function vote({user_id, car_id,comment}){
    const [result] = await db.query(
        'INSERT INTO votes (user_id, car_id,comment) VALUES (?,?,?)',
        [user_id, car_id,comment]
    )
    return result.insertId;
}



async function getLatestVote() {
    const [rows] = await db.query('SELECT * FROM votes ORDER BY id DESC LIMIT 1');
    return rows[0];
}

async function getVoteByUserAndComment(user_id, comment) {
    const [rows] = await db.query(
        'SELECT * FROM votes WHERE user_id = ? AND comment = ? ORDER BY created_at DESC LIMIT 1',
        [user_id, comment]
    );
    return rows.length ? rows[0] : null;
}

async function deleteUser(username) {
    await db.query('DELETE FROM votes WHERE user_id = (SELECT id FROM users WHERE username = ?)', [username]);
    await db.query('DELETE FROM users WHERE username = ?', [username]);
}


// sql injections

async function userExists(username) {
  const [rows] = await db.query(
    'SELECT * FROM users WHERE username = ? LIMIT 1',
    [username]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function getUserByUsername(first_name) {
  const [rows] = await db.query(
    'SELECT * FROM users WHERE username = ? LIMIT 1',
    [first_name]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function countUsersByUsername(username) {
  const [rows] = await db.query(
    'SELECT COUNT(*) as count FROM users WHERE username = ?',
    [username]
  );
  return rows[0].count;
}







module.exports = { db, insertUsers, 
    generateTestUser,
    getLatestUser,
    registerUserViaUI,
    updateUserFirstName,
    updatedPassword,
    vote,
    getLatestVote,
    deleteUser,
    getVoteByUserAndComment,
    userExists,
    countUsersByUsername,
    getUserByUsername

};