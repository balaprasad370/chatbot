const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const mysql = require("mysql");
const cors = require('cors') 

dotenv.config();


const app = express();
const port = process.env.PORT || 9000;



app.use(express.json());
app.use(express.static("public")); // Serve static files from the "public" directory
app.use(cors()); 


// MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // replace with your MySQL username
  password: "U1loHbU0BZgP", // replace with your MySQL password
  database: "chatbot"
});

db.connect(err => {
  if (err) {
    console.error("Error connecting to MySQL:", err.stack);
    return;
  }
  console.log("Connected to MySQL as id", db.threadId);
});

app.get("/messages", (req, res) => {
  db.query("SELECT * FROM messages ORDER BY timestamp ASC", (err, results) => {
    if (err) {
      console.error("Error retrieving messages:", err.stack);
      return res.status(500).send("Error retrieving messages");
    }
    res.json(results);
  });
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await axios({
      method: "post",
      url: "https://api.openai.com/v1/chat/completions",
      data: {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userMessage }]
      },
      headers: {
        Authorization:
          "Bearer  replace-key"
      }
    });
    
    const botReply = response.data.choices[0].message.content.trim();

    // Save messages to MySQL
    db.query(
      "INSERT INTO messages (user_message, bot_reply) VALUES (?, ?)",
      [userMessage, botReply],
      (err, results) => {
        if (err) {
          console.error("Error saving to database:", err.stack);
          return res.status(500).send("Error processing request");
        }
        res.json({ reply: botReply });
      }
    );
  } catch (error) {
    console.error("Error communicating with OpenAI:", error.stack);
    res.status(500).send("Error processing request");
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
