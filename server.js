
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
    stock: 20
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
