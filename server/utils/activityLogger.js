// Function to log user activity
export const logUserActivity = (db, userId, action, description, details = null, req = null) => {
  const ip_address = req ? req.ip || req.connection.remoteAddress : null;
  const user_agent = req ? req.get('User-Agent') : null;
  
  db.run(`INSERT INTO user_activity (user_id, action, description, details, ip_address, user_agent)
          VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, action, description, details, ip_address, user_agent],
    (err) => {
      if (err) {
        console.error('Error logging user activity:', err);
      }
    }
  );
};