
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());

// ==================== MONGODB CONNECTION ====================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("MongoDB connected successfully");

    // Add sample products if the collection is empty
    const productCount = await Product.countDocuments();

    if (productCount === 0) {
      await Product.insertMany(initialProducts);
      console.log("Sample products inserted");
    }

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`PetCart API running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });

// ==================== PRODUCT MODEL ====================

const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
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

// ==================== USER MODEL ====================

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

// ==================== INITIAL PRODUCTS ====================

const initialProducts = [
  {
    id: 1,
    name: "Royal Canin Dog Food",
    price: 1899,
    category: "Dog Food",
    weight: "3 kg",
    rating: 4.8,
    reviews: 120,
    image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 2,
    name: "Pedigree Adult Dog Food",
    price: 599,
    category: "Dog Food",
    weight: "1.2 kg",
    rating: 4.5,
    reviews: 95,
    image: "https://images.unsplash.com/photo-1582798358481-d199fb7347bb?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 3,
    name: "Premium Cat Food",
    price: 799,
    category: "Cat Food",
    weight: "1 kg",
    rating: 4.6,
    reviews: 80,
    image: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 4,
    name: "Pet Chew Toy",
    price: 249,
    category: "Toys",
    weight: "1 piece",
    rating: 4.4,
    reviews: 45,
    image: "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 5,
    name: "Comfortable Pet Bed",
    price: 299,
    category: "Accessories",
    weight: "Medium",
    rating: 4.7,
    reviews: 65,
    image: "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 6,
    name: "Cute Pet Puppy",
    price: 499,
    category: "Accessories",
    weight: "1 piece",
    rating: 4.5,
    reviews: 32,
    image: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 7,
    name: "Cat Scratching Toy",
    price: 399,
    category: "Cat Toys",
    weight: "1 piece",
    rating: 4.3,
    reviews: 28,
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 8,
    name: "Pet Care Essentials",
    price: 599,
    category: "Grooming",
    weight: "Starter kit",
    rating: 4.6,
    reviews: 41,
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 9,
    name: "Dog Walking Companion",
    price: 699,
    category: "Accessories",
    weight: "1 piece",
    rating: 4.7,
    reviews: 53,
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=500&q=80"
  },
  {
    id: 10,
    name: "Cat Comfort Collection",
    price: 899,
    category: "Cat Accessories",
    weight: "1 set",
    rating: 4.5,
    reviews: 37,
    image: "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=500&q=80"
  }
];

// ==================== HOME ROUTE ====================

app.get("/", (req, res) => {
  res.json({
    message: "PetCart API is running!",
    endpoints: [
      "GET /",
      "GET /products",
      "POST /products",
      "GET /register",
      "POST /register",
      "GET /users"
    ]
  });
});

// ==================== GET ALL PRODUCTS ====================

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ id: 1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch products"
    });
  }
});

// ==================== ADD A PRODUCT ====================

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

    const lastProduct = await Product.findOne().sort({ id: -1 });
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

// ==================== REGISTER PAGE TEST ====================

app.get("/register", (req, res) => {
  res.json({
    message: "PetCart registration API is working!",
    instruction: "Send a POST request to /register to create an account."
  });
});

// ==================== REGISTER USER ====================

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
        message: "Password must be at least 8 characters long"
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

// ==================== GET ALL REGISTERED USERS ====================

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
