const { Op, col, fn, where } = require("sequelize");
const { UnauthorizedError, ValidationError } = require("../helper/customErrors");
const { bcryptHash, bcryptCompare } = require("../helper/bcrypt");
const { jwtSign } = require("../helper/jwt");
const {
  validateEmail,
  validateImageUrl,
  validatePassword,
  validateUsername,
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
    const updates = req.body?.user;
    if (!updates || typeof updates !== "object") throw new ValidationError("User details are required.");

    const fields = {};
    if (updates.username !== undefined) fields.username = validateUsername(updates.username);
    if (updates.email !== undefined) fields.email = validateEmail(updates.email);
    if (updates.image !== undefined) fields.image = validateImageUrl(updates.image);
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
