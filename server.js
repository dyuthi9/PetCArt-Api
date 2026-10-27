
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Temporary storage for registered users
// Data will be lost when the server restarts.
let users = [];

// Product data
let products = [
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

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "PetCart API is running!",
    endpoints: [
      "GET /",
      "GET /products",
      "POST /products",
      "GET /register",
      "POST /register"
    ]
  });
});

// Get all products
app.get("/products", (req, res) => {
  res.status(200).json(products);
});

// Add a product
app.post("/products", (req, res) => {
  const { name, price, category, weight, rating, reviews, image } =
    req.body;

  if (!name || price == null || !category) {
    return res.status(400).json({
      message: "Name, price, and category are required"
    });
  }

  const product = {
    id: Date.now(),
    name,
    price,
    category,
    weight: weight || "",
    rating: rating ?? 0,
    reviews: reviews ?? 0,
    image: image || ""
  };

  products.push(product);

  res.status(201).json({
    message: "Product added successfully",
    product
  });
});

// Test registration route in a browser
app.get("/register", (req, res) => {
  res.status(200).json({
    message: "PetCart registration API is working!",
    instruction: "Use POST /register to create an account."
  });
});

// Register a user
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
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

    const normalizedEmail = email.trim().toLowerCase();

    // Basic password validation
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long"
      });
    }

    // Check duplicate email
    const existingUser = users.find(
      user => user.email === normalizedEmail
    );

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered"
      });
    }

    // Hash password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    };

    users.push(newUser);

    // Never send the password or password hash to the client
    return res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Internal server error"
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`PetCart API running on port ${PORT}`);
});
