
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

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

app.get("/", (req, res) => {
  res.send("PetCart API is running!");
});

app.get("/products", (req, res) => {
  res.json(products);
});

app.post("/products", (req, res) => {
  const product = {
    id: Date.now(),
    ...req.body
  };

  products.push(product);
  res.status(201).json(product);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
