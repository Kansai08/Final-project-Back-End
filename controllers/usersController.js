const passport = require("passport");
const express = require("express");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const mongoDbInstant = require("../db/mongoDb");
const { validateCreateUser } = require("../validator/user");
const { isAdmin } = require("../middlewares/userRole");

const router = express();
const client = mongoDbInstant.getMongoClient();
const collectionName = "users";

const saltRounds = 10;

const requireJWT = passport.authenticate("jwt", { session: false });

// Get all users
router.get("/", requireJWT, isAdmin, async (req, res) => {
  try {
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);

    const users = await collection.find({}, { projection: { password: 0 } }).toArray();

    res.status(200).send({
      message: "Users found",
      users: users,
    });
  } catch (error) {
    res.status(500).send({
      message: "Error fetching users",
      error: error.message,
    });
  } finally {
    await client.close();
  }
});

// Create a new user
router.post("/", validateCreateUser, async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;

    if (!["admin", "user"].includes(role)) {
      return res.status(400).send({
        message: "Invalid role. Must be either 'admin' or 'user'",
      });
    }

    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);

    const userExists = await collection.countDocuments({ username });
    if (userExists > 0) {
      return res.status(400).send({
        message: "Username already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = {
      username,
      password: passwordHash,
      full_name,
      role,
    };

    const result = await collection.insertOne(user);

    return res.status(201).send({
      message: "User created successfully",
      userId: result.insertedId,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Error creating user",
      error: error.message,
    });
  } finally {
    await client.close();
  }
});

// Delete user by ID
router.delete("/:id", requireJWT, isAdmin, async (req, res) => {
  const userId = req.params.id;

  if (!ObjectId.isValid(userId)) {
    return res.status(400).send({ message: "Invalid user ID" });
  }

  try {
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);

    const result = await collection.deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).send({
      message: "Error deleting user",
      error: error.message,
    });
  } finally {
    await client.close();
  }
});

// Update user by ID
router.put("/:id", requireJWT, isAdmin, async (req, res) => {
  const userId = req.params.id;
  const { username, password, full_name, role } = req.body;

  if (!ObjectId.isValid(userId)) {
    return res.status(400).send({ message: "Invalid user ID" });
  }

  const updateFields = {};
  if (username) updateFields.username = username;
  if (password) updateFields.password = await bcrypt.hash(password, saltRounds);
  if (full_name) updateFields.full_name = full_name;
  if (role) {
    if (!["admin", "user"].includes(role)) {
      return res.status(400).send({ message: "Invalid role. Must be either 'admin' or 'user'" });
    }
    updateFields.role = role;
  }

  try {
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection(collectionName);

    const result = await collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.status(200).send({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).send({
      message: "Error updating user",
      error: error.message,
    });
  } finally {
    await client.close();
  }
});

module.exports = router;
