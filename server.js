
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

// ==================================================
// MIDDLEWARE
// ==================================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ==================================================
// PRODUCT MODEL
// ==================================================

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

// ==================================================
// USER MODEL
// ==================================================

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

// ==================================================
// CART MODEL
// ==================================================

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    }
  }]
}, {
  timestamps: true
});

const Cart = mongoose.model("Cart", cartSchema);

// ==================================================
// ORDER MODEL
// ==================================================

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  items: [{
    productId: mongoose.Schema.Types.ObjectId,
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    image: {
      type: String,
      default: ""
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: [
      "Pending",
      "Confirmed",
      "Shipped",
      "Delivered",
      "Cancelled"
    ],
    default: "Pending"
  }
}, {
  timestamps: true
});

const Order = mongoose.model("Order", orderSchema);

// ==================================================
// JWT AUTHENTICATION
// ==================================================

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Please log in to continue"
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Server configuration error"
    });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId ||
        !mongoose.isValidObjectId(decoded.userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid login session"
      });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired login session"
    });
  }
};

// ==================================================
// HOME ROUTE
// ==================================================

app.get("/", (req, res) => {
  res.json({
    message: "PetCart API is running!",
    version: "2-login-cart-orders",
    endpoints: [
      "GET /",
      "GET /products",
      "GET /products/:id",
      "POST /products",
      "POST /register",
      "GET /register",
      "POST /login",
      "GET /users",
      "GET /me",
      "GET /cart",
      "POST /cart/add",
      "PATCH /cart/:productId",
      "DELETE /cart/:productId",
      "DELETE /cart",
      "GET /orders",
      "POST /orders"
    ]
  });
});

// ==================================================
// GET ALL PRODUCTS
// ==================================================

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ id: 1 });
    res.status(200).json(products);
  } catch (error) {
    console.error("Fetch products error:", error.message);
    res.status(500).json({
      message: "Failed to fetch products"
    });
  }
});

// ==================================================
// GET PRODUCT BY NUMERIC ID
// ==================================================

app.get("/products/:id", async (req, res) => {
  try {
    const numericId = Number(req.params.id);

    if (!Number.isSafeInteger(numericId) || numericId < 1) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const product = await Product.findOne({ id: numericId });

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);
  } catch (error) {
    console.error("Fetch product error:", error.message);
    res.status(500).json({
      message: "Failed to fetch product"
    });
  }
});

// ==================================================
// ADD PRODUCT
// ==================================================

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
      price === undefined ||
      price === null ||
      price === "" ||
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
    console.error("Add product error:", error.message);
    res.status(500).json({
      message: "Failed to add product"
    });
  }
});

// ==================================================
// REGISTER USER
// ==================================================

app.get("/register", (req, res) => {
  res.json({
    message: "PetCart registration API is working",
    instruction: "Use POST /register to create an account"
  });
});

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
      success: true,
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

    console.error("Registration error:", error.message);
    res.status(500).json({
      message: "Registration failed"
    });
  }
});

// ==================================================
// GET REGISTERED USERS
// ==================================================

app.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("name email createdAt");

    res.json(users);
  } catch (error) {
    console.error("Fetch users error:", error.message);
    res.status(500).json({
      message: "Failed to fetch users"
    });
  }
});

// ==================================================
// LOGIN USER
// ==================================================

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email and password"
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");
      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
    });
  }
});

// ==================================================
// GET LOGGED-IN USER PROFILE
// ==================================================

app.get("/me", authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("name email createdAt");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.json({ user });
  } catch (error) {
    console.error("Profile error:", error.message);
    res.status(500).json({
      message: "Failed to fetch profile"
    });
  }
});

// ==================================================
// GET USER CART
// ==================================================

app.get("/cart", authenticateUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId })
      .populate("items.product");

    res.json({
      items: cart ? cart.items : []
    });
  } catch (error) {
    console.error("Get cart error:", error.message);
    res.status(500).json({
      message: "Failed to fetch cart"
    });
  }
});

// ==================================================
// ADD PRODUCT TO CART
// ==================================================

app.post("/cart/add", authenticateUser, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (
      typeof productId !== "string" ||
      !mongoose.isValidObjectId(productId) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 100
    ) {
      return res.status(400).json({
        message: "Valid productId and quantity are required"
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    let cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      cart = new Cart({
        user: req.userId,
        items: []
      });
    }

    const existingItem = cart.items.find(
      item => item.product.toString() === product._id.toString()
    );

    if (existingItem) {
      if (existingItem.quantity + quantity > 100) {
        return res.status(400).json({
          message: "Maximum quantity is 100 per product"
        });
      }

      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: product._id,
        quantity
      });
    }

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate("items.product");

    res.json({
      message: "Product added to cart successfully",
      items: updatedCart.items
    });
  } catch (error) {
    console.error("Add to cart error:", error.message);
    res.status(500).json({
      message: "Failed to add product to cart"
    });
  }
});

// ==================================================
// UPDATE CART QUANTITY
// ==================================================

app.patch("/cart/:productId", authenticateUser, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (
      !mongoose.isValidObjectId(productId) ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 100
    ) {
      return res.status(400).json({
        message: "Quantity must be an integer from 1 to 100"
      });
    }

    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    const item = cart.items.find(
      entry => entry.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        message: "Product not found in cart"
      });
    }

    item.quantity = quantity;
    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate("items.product");

    res.json({
      message: "Cart updated successfully",
      items: updatedCart.items
    });
  } catch (error) {
    console.error("Update cart error:", error.message);
    res.status(500).json({
      message: "Failed to update cart"
    });
  }
});

// ==================================================
// REMOVE PRODUCT FROM CART
// ==================================================

app.delete("/cart/:productId", authenticateUser, async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const cart = await Cart.findOne({ user: req.userId });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();

    const updatedCart = await Cart.findById(cart._id)
      .populate("items.product");

    res.json({
      message: "Product removed from cart",
      items: updatedCart.items
    });
  } catch (error) {
    console.error("Remove cart item error:", error.message);
    res.status(500).json({
      message: "Failed to remove product"
    });
  }
});

// ==================================================
// CLEAR USER CART
// ==================================================

app.delete("/cart", authenticateUser, async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.userId },
      { $set: { items: [] } },
      { new: true }
    );

    res.json({
      message: "Cart cleared successfully",
      items: []
    });
  } catch (error) {
    console.error("Clear cart error:", error.message);
    res.status(500).json({
      message: "Failed to clear cart"
    });
  }
});

// ==================================================
// GET USER'S PAST ORDERS
// ==================================================

app.get("/orders", authenticateUser, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (error) {
    console.error("Fetch orders error:", error.message);
    res.status(500).json({
      message: "Failed to fetch orders"
    });
  }
});

// ==================================================
// CREATE ORDER FROM CART
// ==================================================

// Demo checkout only. This does not verify or collect payment.
// Connect a real payment provider before accepting real orders.

app.post("/orders", authenticateUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId })
      .populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message: "Your cart is empty"
      });
    }

    const items = [];
    let total = 0;

    for (const cartItem of cart.items) {
      const product = cartItem.product;

      if (!product) {
        return res.status(400).json({
          message: "A product in your cart is unavailable"
        });
      }

      const price = Number(product.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          message: "Invalid product price"
        });
      }

      items.push({
        productId: product._id,
        name: product.name,
        price,
        image: product.image || "",
        quantity: cartItem.quantity
      });

      total += price * cartItem.quantity;
    }

    const order = await Order.create({
      user: req.userId,
      items,
      total: Number(total.toFixed(2)),
      status: "Pending"
    });

    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: "Demo order created successfully",
      order
    });
  } catch (error) {
    console.error("Create order error:", error.message);
    res.status(500).json({
      message: "Failed to create order"
    });
  }
});

// ==================================================
// NOT FOUND HANDLER
// ==================================================

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.path}`
  });
});

// ==================================================
// ERROR HANDLER
// ==================================================

app.use((error, req, res, next) => {
  console.error("Server error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  if (error.message === "Origin not allowed by CORS") {
    return res.status(403).json({
      message: "Frontend origin is not allowed"
    });
  }

  res.status(500).json({
    message: "Internal server error"
  });
});

// ==================================================
// START SERVER
// ==================================================

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from environment");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from environment");
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
