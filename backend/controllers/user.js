const { Op, col, fn, where } = require("sequelize");
const { UnauthorizedError, ValidationError } = require("../helper/customErrors");
const { bcryptHash, bcryptCompare } = require("../helper/bcrypt");
const { jwtSign } = require("../helper/jwt");
const {
  validateEmail,
  validateImageUrl,
  validatePassword,
  validateUsername,
  validateObject,
  validateOptionalString,
} = require("../helper/validation");
const { User } = require("../models");

const currentUser = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();
    loggedUser.dataValues.email = req.headers.email;
    delete req.headers.email;
    res.json({ user: loggedUser });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();
    const updates = validateObject(req.body, "request", ["user"]).user;
    validateObject(updates, "user", ["username", "email", "password", "bio", "image"]);

    const fields = {};
    if (updates.username !== undefined) fields.username = validateUsername(updates.username);
    if (updates.email !== undefined) fields.email = validateEmail(updates.email);
    if (updates.image !== undefined) fields.image = validateImageUrl(updates.image);
    validateOptionalString(updates.bio, "Bio");
    validateOptionalString(updates.image, "Image", 2048);
    if (updates.password !== undefined && typeof updates.password !== "string") throw new ValidationError("Password must be a string.");
    if (updates.bio !== undefined) {
      if (typeof updates.bio !== "string" || updates.bio.length > 9000) {
        throw new ValidationError("Short bio must not exceed 9000 characters.");
      }
      if (updates.bio.trim() !== updates.bio || / {2,}/.test(updates.bio)) {
        throw new ValidationError("Short bio must not start or end with spaces or contain repeated spaces.");
      }
      fields.bio = updates.bio;
    }

    for (const [field, value] of [["username", fields.username], ["email", fields.email]]) {
      if (!value) continue;
      const duplicate = await User.findOne({
        where: {
          [Op.and]: [
            where(fn("LOWER", col(field)), value),
            { id: { [Op.ne]: loggedUser.id } },
          ],
        },
      });
      if (duplicate) {
        throw new ValidationError(field === "username" ? "This username is taken." : "This email is taken. Want to log in?");
      }
    }

    if (updates.password) {
      const password = validatePassword(updates.password);
      if (await bcryptCompare(password, loggedUser.password)) {
        throw new ValidationError("The new password must be different from the current password.");
      }
      fields.password = await bcryptHash(password);
    }

    await loggedUser.update(fields);
    loggedUser.dataValues.token = await jwtSign(loggedUser);
    res.json({ user: loggedUser });
  } catch (error) {
    next(error);
  }
};

module.exports = { currentUser, updateUser };
