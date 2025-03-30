const express = require("express");
const passport = require("passport");
const { ObjectId } = require("mongodb");
const mongoDbInstant = require("../db/mongoDb");
const { validateCreateOrder } = require("../validator/order");

const router = express();
const client = mongoDbInstant.getMongoClient();
const orderCollection = "orders";
const productCollection = "products";

const requireJWT = passport.authenticate("jwt", { session: false });

// Create order [user]
router.post("/", requireJWT, validateCreateOrder, async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = req.user._id;

  if (!ObjectId.isValid(productId)) {
    return res.status(400).send({ message: "Invalid product ID" });
  }

  try {
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const productsCollection = db.collection(productCollection);
    const ordersCollection = db.collection(orderCollection);

    // Get product and check stock
    const product = await productsCollection.findOne({ _id: new ObjectId(productId) });
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).send({
        message: "Insufficient stock",
        availableStock: product.stock,
      });
    }

    // Create order and update stock atomically
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        // Create order
        const order = {
          userId: new ObjectId(userId),
          productId: new ObjectId(productId),
          quantity: Number(quantity),
          totalPrice: product.price * quantity,
          status: "completed",
          createdAt: new Date(),
        };
        
        await ordersCollection.insertOne(order, { session });

        // Update product stock
        await productsCollection.updateOne(
          { _id: new ObjectId(productId) },
          { $inc: { stock: -quantity } },
          { session }
        );
      });

      res.status(201).send({ message: "Order created successfully" });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    res.status(500).send({
      message: "Error creating order",
      error: error.message,
    });
  } finally {
    await client.close();
  }
});

// Get user orders [user]
router.get("/my-orders", requireJWT, async (req, res) => {
  const userId = req.user._id;

  if (!ObjectId.isValid(userId)) {
    return res.status(400).send({ message: "Invalid user ID" });
  }

  try {
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(orderCollection);
    
    const orders = await collection.aggregate([
      {
        $match: { userId: new ObjectId(userId) }
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $unwind: "$product"
      },
      {
        $project: {
          _id: 1,
          quantity: 1,
          totalPrice: 1,
          status: 1,
          createdAt: 1,
          product: {
            _id: 1,
            name: 1,
            price: 1
          }
        }
      }
    ]).toArray();
    
    res.status(200).send({
      message: "Orders found",
      orders: orders,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error fetching orders",
      error: error.message,
    });
  } finally {
    await client.close();
  }
});

module.exports = router;