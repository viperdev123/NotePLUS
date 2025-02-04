import express from "express";
import admin from "firebase-admin";
import bcrypt from "bcrypt";
import credentials from "./noteplus-8f2b0-firebase-adminsdk-fbsvc-dc83ae1dc9.json" assert { type: "json" };
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
admin.initializeApp({
  credential: admin.credential.cert(credentials),
});

const db = admin.firestore();

const countersRef = db.collection("counters").doc("userCounter");

async function getNextUserId() {
  const counterDoc = await countersRef.get();
  let nextId = 1;

  if (counterDoc.exists) {
    nextId = counterDoc.data().count + 1;
  }

  // Update the counter in Firestore
  await countersRef.set({ count: nextId });

  return nextId;
}

// API for user registration
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const user_id = await getNextUserId();
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserRef = db.collection("users").doc(user_id.toString());
    await newUserRef.set({
      name,
      email,
      password: hashedPassword,
    });
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// API for user login with JWT token generation
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userSnapshot = await db.collection("users").where("email", "==", email).get();

    if (userSnapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const storedPassword = userData.password;

    // Check password validity
    const isPasswordValid = await bcrypt.compare(password, storedPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token if credentials are valid
    const token = jwt.sign(
      { name: userData.name, email: userData.email }, // Payload (name, email)
      JWT_SECRET, // Secret key to sign the JWT
      { expiresIn: "24h" } // Token expiration time (1 hour)
    );
    // Return the token to the client
    res.status(200).json({
      message: "Login successful",
      token: token, // Send token in response
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "An error occurred. Please try again." });
  }
});


// Middleware to protect routes (example of a protected route)
function authenticateToken(req, res, next) {
  const token = req.header("Authorization")?.replace("Bearer ", ""); // Get token from headers

  if (!token) {
    return res.status(401).json({ error: "Access denied, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET); // Verify the token
    req.user = decoded; // Attach user data to the request
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

// Example of a protected route
app.get("/api/user-info", authenticateToken, (req, res) => {
  res.json({ name: req.user.name, email: req.user.email });
});
// API สำหรับบันทึก Note ไปที่ Firestore
app.post("/api/notes", authenticateToken, async (req, res) => {
  const { category, title, content } = req.body;
  const userEmail = req.user.email; // ได้จาก JWT ที่ decode

  if (!category || !title || !content) {
    return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบ" });
  }

  try {
    const noteRef = db.collection("notes").doc(); // สร้าง Note ID อัตโนมัติ
    await noteRef.set({
      userEmail,
      category,
      title,
      content,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: "Note บันทึกสำเร็จ", noteId: noteRef.id });
  } catch (error) {
    console.error("Error saving note:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกโน้ต" });
  }
});

// API สำหรับดึงข้อมูล Notes จาก Firestore
app.get("/api/notes", authenticateToken, async (req, res) => {
  const userEmail = req.user.email; // ได้จาก JWT ที่ decode

  try {
    // ดึงข้อมูล Notes จาก Firestore ที่เชื่อมโยงกับอีเมลของผู้ใช้
    const notesSnapshot = await db.collection("notes")
      .where("userEmail", "==", userEmail)
      .orderBy("createdAt", "desc") // จัดเรียงตามวันที่สร้าง (ล่าสุดไปหาก่อน)
      .get();

    if (notesSnapshot.empty) {
      return res.status(404).json({ error: "ไม่มีโน้ตสำหรับผู้ใช้นี้" });
    }

    // เก็บข้อมูลโน้ตที่ดึงมาในรูปแบบของ array
    const notes = notesSnapshot.docs.map(doc => ({
      noteId: doc.id,
      ...doc.data(),
    }));

    res.status(200).json(notes); // ส่งข้อมูลโน้ตทั้งหมดให้ client
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลโน้ต" });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  const { id } = req.params;
  const updatedNote = req.body;
  
  try {
    const noteRef = db.collection('notes').doc(id);
    const doc = await noteRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ message: "Note not found" });
    }

    await noteRef.update(updatedNote);
    res.status(200).json({ message: "Note updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating note", error });
  }
});

// API สำหรับลบ Note จาก Firestore
app.delete("/api/notes/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userEmail = req.user.email; // ได้จาก JWT ที่ decode

  try {
    const noteRef = db.collection("notes").doc(id);
    const noteDoc = await noteRef.get();

    if (!noteDoc.exists) {
      return res.status(404).json({ error: "Note not found" });
    }

    // ตรวจสอบว่าโน้ตเป็นของผู้ใช้คนนี้หรือไม่
    if (noteDoc.data().userEmail !== userEmail) {
      return res.status(403).json({ error: "You do not have permission to delete this note" });
    }

    await noteRef.delete();
    res.status(200).json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการลบโน้ต" });
  }
});


// Start server
app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
