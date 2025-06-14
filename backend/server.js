const express = require('express');
const path = require('path');           // Required to use path.join
const db = require('./db');             // Import the MySQL connection
const app = express();
const bcrypt = require('bcrypt'); // Install with: npm install bcrypt
app.use(express.json());                // Middleware to parse JSON request bodies
const cors = require('cors');
app.use(cors());

// ✅ Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..', 'frontend')));


// ✅ Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  });
  

// Get all questions
app.get('/questions', (req, res) => {
  const searchQuery = req.query.search;
  let sql, params;

  if (searchQuery) {
    // Search in both question_text and tags, and get answer counts
    sql = `
      SELECT q.id, q.question_text, q.tags, q.created_at,
             (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.id) as answer_count
      FROM questions q
      WHERE LOWER(q.question_text) LIKE LOWER(?) 
         OR LOWER(q.tags) LIKE LOWER(?)
      ORDER BY q.id DESC`;
    const searchPattern = `%${searchQuery}%`;
    params = [searchPattern, searchPattern];

    // Log the search query and parameters
    console.log('Search Query:', searchQuery);
    console.log('SQL:', sql);
    console.log('Parameters:', params);
  } else {
    // Get all questions with answer counts
    sql = `
      SELECT q.id, q.question_text, q.tags, q.created_at,
             (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.id) as answer_count
      FROM questions q
      ORDER BY q.id DESC`;
    params = [];
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch questions from database' });
    }
    
    // Log the raw results for debugging
    console.log('Number of results:', results.length);
    console.log('Raw results:', JSON.stringify(results, null, 2));
    
    // Format the results
    const formattedResults = results.map(q => ({
      id: q.id,
      question_text: q.question_text,
      tags: q.tags,
      answer_count: q.answer_count,
      created_at: q.created_at
    }));

    // Log the formatted results
    console.log('Formatted results:', JSON.stringify(formattedResults, null, 2));

    res.json(formattedResults);
  });
});

// Add a new question
app.post('/questions', (req, res) => {
  const { questionTitle, tags } = req.body;

  if (!questionTitle) {
    return res.status(400).json({ error: 'Question title is required.' });
  }

  const sql = 'INSERT INTO questions (question_text, tags) VALUES (?, ?)';
  db.query(sql, [questionTitle, tags || null], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }

    res.json({
      id: result.insertId,
      question_text: questionTitle,
      tags: tags || null,
    });
  });
});

// Get question by ID (with answers)
app.get('/questions/:id', (req, res) => {
  const questionId = req.params.id;

  db.query('SELECT * FROM questions WHERE id = ?', [questionId], (err, questionResults) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch question from database' });
    }
    if (questionResults.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    const question = questionResults[0];

    db.query('SELECT * FROM answers WHERE question_id = ?', [questionId], (err, answerResults) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch answers from database' });
      }

      res.json({
        id: question.id,
        question_text: question.question_text,
        tags: question.tags,
        answers: answerResults.map(answer => ({
          id: answer.id,
          answer_text: answer.answer_text,
          created_at: answer.created_at
        }))
      });
    });
  });
});

// Add an answer
app.post('/answers', (req, res) => {
  const { question_id, answer_text } = req.body;

  if (!question_id || !answer_text) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      details: {
        question_id: !question_id ? 'Question ID is required' : null,
        answer_text: !answer_text ? 'Answer text is required' : null
      }
    });
  }

  // First verify the question exists
  db.query('SELECT id FROM questions WHERE id = ?', [question_id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to verify question existence' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Question exists, proceed with adding the answer
    const sql = 'INSERT INTO answers (question_id, answer_text) VALUES (?, ?)';
    db.query(sql, [question_id, answer_text], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to save answer to database' });
      }

      res.status(201).json({
        success: true,
        id: result.insertId,
        question_id,
        answer_text,
        created_at: new Date()
      });
    });
  });
});

// ✅ Signup route
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Check if username already exists
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, usernameResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error.' });
      }

      if (usernameResults.length > 0) {
        return res.status(409).json({ error: 'Username already exists. Please choose a different username.' });
      }

      // Check if email already exists
      db.query('SELECT * FROM users WHERE email = ?', [email], async (err, emailResults) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database error.' });
        }

        if (emailResults.length > 0) {
          return res.status(409).json({ error: 'Email already exists.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        db.query(
          'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
          [username, email, hashedPassword],
          (err, result) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ error: 'Error saving user.' });
            }

            res.status(201).json({ message: 'User registered successfully' });
          }
        );
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
});
// ✅ Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error.' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    res.status(200).json({ message: 'Login successful', username: user.username });
  });
});


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
