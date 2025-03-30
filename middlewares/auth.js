const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const JwtStrategy = require("passport-jwt").Strategy;
const extractJwt = require("passport-jwt").ExtractJwt;
const mongoDbInstant = require("../db/mongoDb");

const client = mongoDbInstant.getMongoClient();

const jwtOptions = {
  jwtFromRequest: extractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.jwt_secret,
};

const userSignIn = new LocalStrategy(
  {
    usernameField: "username",
    passwordField: "password",
  },
  async (username, password, done) => {
    try {
      await client.connect();
      const db = client.db(mongoDbInstant.getDbName());
      const collection = db.collection("users");

      const user = await collection.findOne({ username });

      if (!user) {
        return done(null, false, { message: "Username not found." });
      }

      if (!bcrypt.compareSync(password, user.password)) {
        return done(null, false, { message: "Incorrect password" });
      }

      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error);
    } finally {
      await client.close();
    }
  }
);

const jwtAuth = new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    await client.connect();
    const db = client.db(mongoDbInstant.getDbName());
    const collection = db.collection("users");
    
    const user = await collection.findOne({ username: payload.username });
    if (user) {
      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;
      return done(null, userWithoutPassword);
    }
    return done(null, false);
  } catch (error) {
    return done(error);
  } finally {
    await client.close();
  }
});

passport.use("user-local", userSignIn);
passport.use("jwt", jwtAuth);

module.exports = passport;