
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// ================= MIDDLEWARE =================

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ================= PRODUCT MODEL =================

const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  weight: {
    type: String,
    default: ""
  },
  rating: {
    type: Number,
    default: 0
  },
  reviews: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    default: ""
  }
});

const Product = mongoose.model("Product", productSchema);

// ================= USER MODEL =================

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false
  }
}, {
  timestamps: true
});

const User = mongoose.model("User", userSchema);

// ================= HOME ROUTE =================

app.get("/", (req, res) => {
  res.json({
    message: "PetCart API is running!",
    endpoints: [
      "GET /products",
      "POST /products",
      "GET /register",
      "POST /register",
      "GET /users"
    ]
  });
});

// ================= GET ALL PRODUCTS =================
// Products come directly from MongoDB.

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ id: 1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Fetch products error:", error);

    res.status(500).json({
      message: "Failed to fetch products"
    });
  }
});

// ================= GET PRODUCT BY ID =================

app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findOne({
      id: Number(req.params.id)
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch product"
    });
  }
});

// ================= ADD PRODUCT =================

app.post("/products", async (req, res) => {
  try {
    const {
      name,
      price,
      category,
      weight,
      rating,
      reviews,
      image
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      price == null ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0 ||
      typeof category !== "string" ||
      !category.trim()
    ) {
      return res.status(400).json({
        message: "Valid name, price, and category are required"
      });
    }

    const lastProduct = await Product.findOne({
      id: { $exists: true }
    }).sort({ id: -1 });

    const nextId = lastProduct ? lastProduct.id + 1 : 1;

    const product = await Product.create({
      id: nextId,
      name: name.trim(),
      price: Number(price),
      category: category.trim(),
      weight: weight || "",
      rating: rating ?? 0,
      reviews: reviews ?? 0,
      image: image || ""
    });

    res.status(201).json({
      message: "Product added successfully",
      product
    });
  } catch (error) {
    console.error("Add product error:", error);

    res.status(500).json({
      message: "Failed to add product"
    });
  }
});

// ================= REGISTRATION ROUTE TEST =================

app.get("/register", (req, res) => {
  res.json({
    message: "PetCart registration API is working",
    instruction: "Use POST /register to create an account"
  });
});

// ================= REGISTER USER =================

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Name, email, and password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    console.error("Registration error:", error);

    res.status(500).json({
      message: "Registration failed"
    });
  }
});

// ================= GET REGISTERED USERS =================

app.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("name email createdAt");

    res.status(200).json(users);
  } catch (error) {
    console.error("Fetch users error:", error);

    res.status(500).json({
      message: "Failed to fetch users"
    });
  }
});

// ================= START SERVER =================

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`PetCart API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
