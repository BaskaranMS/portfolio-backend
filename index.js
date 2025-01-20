const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Project = require("./models/Project");
const Contact = require("./models/Contact");

const app = express();
const port = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connection
mongoose
  .connect(
    "mongodb+srv://baskaranms:baskaranms@cluster0.1w6llyo.mongodb.net/portfolio?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(async () => {
    console.log("Connected to MongoDB");

    // const username = "m_s_b_0_0_1";
    // const password = "Fuck2711Life@";

    // // Check if the admin already exists
    // const existingAdmin = await User.findOne({ username });
    // if (existingAdmin) {
    //   console.log("Admin already exists");
    //   return;
    // }

    // const hashedPassword = await bcrypt.hash(password, 10);
    // const newAdmin = new User({
    //   username,
    //   password: hashedPassword,
    //   role: "admin",
    // });

    // await newAdmin.save();
    // console.log("Admin user created");
  })
  .catch((err) => console.log("Error connecting to MongoDB:", err));

// Storage setup for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

app.get("/wake", async (req, res) => {
  res.send("waked!").status(200);
});

// Admin Routes
app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await User.findOne({ username });
    if (!admin) {
      return res.status(400).send("Admin not found.");
    }

    const isPasswordCorrect = await bcrypt.compare(password, admin.password);
    if (!isPasswordCorrect) {
      return res.status(400).send("Invalid password.");
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      "your_jwt_secret",
      {
        expiresIn: "1h",
      }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error.");
  }
});

// Middleware to protect routes
const authenticateAdmin = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).send("Access Denied");

  try {
    const verified = jwt.verify(token, "your_jwt_secret");
    req.user = verified;
    if (req.user.role !== "admin") {
      return res.status(403).send("Not authorized");
    }
    next();
  } catch (err) {
    res.status(400).send("Invalid token");
  }
};

// Project Routes
app.post(
  "/api/projects",
  authenticateAdmin,
  upload.single("coverImage"),
  async (req, res) => {
    const { title, shortDescription, markdownContent } = req.body;
    const coverImage = req.file?.path;

    try {
      const newProject = new Project({
        title,
        shortDescription,
        markdownContent,
        coverImage,
      });

      const savedProject = await newProject.save();
      res.json({
        message: "Project created successfully!",
        project: savedProject,
      });
    } catch (error) {
      res.status(500).send("Server error");
    }
  }
);

// Get project by ID
app.get("/api/projects/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).send("Project not found");
    }
    res.json({ project });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Get all projects
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await Project.find(); // Fetch all projects from the database
    res.json({ projects }); // Send the projects back in the response
  } catch (err) {
    res.status(500).send("Server error");
  }
});

app.post("/api/contact", async (req, res) => {
  const { firstName, lastName, email, phoneNumber, message } = req.body;

  try {
    // Save to MongoDB
    const newContact = new Contact({
      firstName,
      lastName,
      email,
      phoneNumber,
      message,
    });

    await newContact.save();

    res
      .status(200)
      .json({ message: "Your message has been sent successfully!" });
  } catch (error) {
    console.error("Error saving contact:", error);
    res
      .status(500)
      .json({ message: "An error occurred while sending your message." });
  }
});

// Server initialization
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
