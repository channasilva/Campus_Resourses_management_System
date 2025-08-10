const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { username, email, password, role, lecturerId } = userData;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Hash the password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Insert into users table
      const userQuery = `
        INSERT INTO users (username, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, role, created_at
      `;
      
      const userResult = await client.query(userQuery, [username, email, passwordHash, role]);
      const user = userResult.rows[0];
      
      // Insert into role-specific table
      if (role === 'lecturer') {
        const lecturerQuery = `
          INSERT INTO lecturers (user_id, lecturer_id, first_name, last_name)
          VALUES ($1, $2, $3, $4)
          RETURNING id, lecturer_id
        `;
        
        // Extract first and last name from username (you might want to add separate fields for this)
        const nameParts = username.split(' ');
        const firstName = nameParts[0] || username;
        const lastName = nameParts.slice(1).join(' ') || '';
        
        await client.query(lecturerQuery, [user.id, lecturerId, firstName, lastName]);
      } else {
        // For students, we'll create a basic student record
        const studentQuery = `
          INSERT INTO students (user_id, student_id, first_name, last_name)
          VALUES ($1, $2, $3, $4)
          RETURNING id, student_id
        `;
        
        const nameParts = username.split(' ');
        const firstName = nameParts[0] || username;
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Generate a student ID (you might want to implement a proper ID generation system)
        const studentId = `STU${Date.now()}`;
        
        await client.query(studentQuery, [user.id, studentId, firstName, lastName]);
      }
      
      await client.query('COMMIT');
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        lecturerId: role === 'lecturer' ? lecturerId : null,
        createdAt: user.created_at
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  static async findByEmail(email) {
    const query = `
      SELECT u.id, u.username, u.email, u.password_hash, u.role, u.created_at,
             l.lecturer_id, s.student_id
      FROM users u
      LEFT JOIN lecturers l ON u.id = l.user_id
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.email = $1
    `;
    
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }
  
  static async findByUsername(username) {
    const query = `
      SELECT u.id, u.username, u.email, u.password_hash, u.role, u.created_at,
             l.lecturer_id, s.student_id
      FROM users u
      LEFT JOIN lecturers l ON u.id = l.user_id
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.username = $1
    `;
    
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }
  
  static async findById(id) {
    const query = `
      SELECT u.id, u.username, u.email, u.role, u.created_at,
             l.lecturer_id, s.student_id
      FROM users u
      LEFT JOIN lecturers l ON u.id = l.user_id
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
  
  static async verifyPassword(password, passwordHash) {
    return await bcrypt.compare(password, passwordHash);
  }
}

module.exports = User; 