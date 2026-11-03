const { Op, col, fn, where } = require("sequelize");
const { User } = require("../models");
const { jwtSign } = require("../helper/jwt");
const { bcryptHash, bcryptCompare } = require("../helper/bcrypt");
const {
  FieldRequiredError,
  NotFoundError,
  ValidationError,
} = require("../helper/customErrors");
const {
  validateEmail,
  validatePassword,
  validateUsername,
} = require("../helper/validation");

const MOCK_EMAIL_CODE = "123456";
const MOCK_EMAIL_MESSAGE = "If an account exists for this email, a one-time code has been sent. In this test build, use 123456.";

const findByEmailOrUsername = (identifier) => {
  const normalized = identifier.trim().toLowerCase();
  return User.findOne({
    where: {
      [Op.or]: [
        where(fn("LOWER", col("email")), normalized),
        where(fn("LOWER", col("username")), normalized),
      ],
    },
  });
};

const signUp = async (req, res, next) => {
  try {
    const details = req.body?.user;
    if (!details || typeof details !== "object") throw new ValidationError("User details are required.");
    if (!details.username) throw new FieldRequiredError("Username");
    if (!details.email) throw new FieldRequiredError("Email");
    if (!details.password) throw new FieldRequiredError("Password");

    const username = validateUsername(details.username);
    const email = validateEmail(details.email);
    const password = validatePassword(details.password);
    if (!process.env.JWT_KEY) throw new Error("JWT_KEY must be set in the root .env file");

    const existingUser = await findByEmailOrUsername(email);
    if (existingUser) throw new ValidationError("This email is taken. Want to log in?");
    const existingUsername = await findByEmailOrUsername(username);
    if (existingUsername) throw new ValidationError("This username is taken.");

    const newUser = await User.create({
      username,
      email,
      bio: details.bio || null,
      image: details.image || null,
      password: await bcryptHash(password),
      emailVerified: false,
    });

    res.status(201).json({
      user: { username: newUser.username, email: newUser.email, verificationRequired: true },
    });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const email = validateEmail(req.body?.email);
    if (req.body?.code !== MOCK_EMAIL_CODE) throw new ValidationError("The verification code is invalid.");
    const user = await findByEmailOrUsername(email);
    if (!user) throw new NotFoundError("User", "with such email or username not registered.");
    if (!user.emailVerified) await user.update({ emailVerified: true });
    user.dataValues.token = await jwtSign(user);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    validateEmail(req.body?.email);
    // The test application has no mail provider; keep this response generic.
    res.json({ message: MOCK_EMAIL_MESSAGE });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const email = validateEmail(req.body?.email);
    if (req.body?.code !== MOCK_EMAIL_CODE) throw new ValidationError("The verification code is invalid.");
    const password = validatePassword(req.body?.password);
    const user = await findByEmailOrUsername(email);
    if (!user) throw new NotFoundError("User", "with such email or username not registered.");
    if (await bcryptCompare(password, user.password)) {
      throw new ValidationError("The new password must be different from the current password.");
    }
    await user.update({ password: await bcryptHash(password) });
    res.json({ message: "Password updated. You can now sign in." });
  } catch (error) {
    next(error);
  }
};

const signIn = async (req, res, next) => {
  try {
    const user = req.body?.user;
    const identifier = user?.email ?? user?.username;
    if (!identifier) throw new FieldRequiredError("Email or Username");
    if (!user?.password) throw new FieldRequiredError("Password");

    const existentUser = await findByEmailOrUsername(String(identifier));
    if (!existentUser) throw new NotFoundError("User", "with such email or username not registered.");
    if (!existentUser.emailVerified) throw new ValidationError("Please verify your email before signing in.");
    if (!(await bcryptCompare(user.password, existentUser.password))) {
      throw new ValidationError("Entered Invalid password! Check your keyboard layout or Caps Lock.");
    }

    existentUser.dataValues.token = await jwtSign(existentUser);
    res.json({ user: existentUser });
  } catch (error) {
    next(error);
  }
};

module.exports = { signUp, signIn, verifyEmail, requestPasswordReset, resetPassword };
