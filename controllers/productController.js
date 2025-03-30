const express = require("express");
const passport = require("passport");
const { ObjectId } = require("mongodb");
const mongoDbInstant = require("../db/mongoDb");
const { validateCreateProduct, validateUpdateProduct } = require("../validator/product");
const { isAdmin } = require("../middlewares/userRole");

const router = express();
const client = mongoDbInstant.getMongoClient();
const collectionName = "products";

const requireJWT = passport.authenticate("jwt", { session: false });

// Get all products [admin&user]
router.get("/", requireJWT, async (req, res) => {
  try {
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);
    
    const products = await collection.find().toArray();
    
    res.status(200).send({
      message: "Products found",
      products: products,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error fetching products",
      error: error.message,
    });
  } finally {
    await client.close();
  }
});

// Create product [admin]
router.post("/", requireJWT, isAdmin, validateCreateProduct, async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;

    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);

    const product = {
      name,
      description,
      price: Number(price),
      stock: Number(stock)
    };

    const result = await collection.insertOne(product);

    res.status(201).send({
      message: "Product created successfully",
      productId: result.insertedId,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error creating product",
      error: error.message,
    });
  } finally {
    await client.close();
  }
});

// Update product [admin]
router.put("/:id", requireJWT, isAdmin, validateUpdateProduct, async (req, res) => {
  const productId = req.params.id;
  const { name, description, price, stock } = req.body;

  if (!ObjectId.isValid(productId)) {
    return res.status(400).send({ message: "Invalid product ID" });
  }

  const updateFields = {
    updatedAt: new Date(),
  };
  
  if (name) updateFields.name = name;
  if (description) updateFields.description = description;
  if (price) updateFields.price = Number(price);
  if (stock !== undefined) updateFields.stock = Number(stock);
  
  try {
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);
    
    const result = await collection.updateOne(
      { _id: new ObjectId(productId) },
      { $set: updateFields }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Product not found" });
    }
    
    res.status(200).send({ message: "Product updated successfully" });
  } catch (error) {
    res.status(500).send({
      message: "Error updating product",
      error: error.message,
    });
  } finally {
    await client.close();
  }
});

// Delete product [admin]
router.delete("/:id", requireJWT, isAdmin, async (req, res) => {
  const productId = req.params.id;

  if (!ObjectId.isValid(productId)) {
    return res.status(400).send({ message: "Invalid product ID" });
  }
  
  try {
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);
    
    const result = await collection.deleteOne({ _id: new ObjectId(productId) });
    
    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Product not found" });
    }
    
    res.status(200).send({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).send({
      message: "Error deleting product",
      error: error.message,
    });
  } finally {
    await client.close();
  }
});

module.exports = router;