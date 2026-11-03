const { NotFoundError } = require("../helper/customErrors");
const { jwtVerify } = require("../helper/jwt");
const { User } = require("../models");

const verifyToken = async (req, res, next) => {
  try {
    const { headers } = req;
    if (!headers.authorization) return next();

    const [scheme, token, ...extra] = headers.authorization.trim().split(/\s+/);
    if (scheme !== "Token" || !token || extra.length) throw new UnauthorizedError();

    let userVerified;
    try {
      userVerified = await jwtVerify(token);
    } catch {
      throw new UnauthorizedError();
    }
    if (!userVerified) throw new UnauthorizedError();

    req.loggedUser = await User.findOne({
      attributes: { exclude: ["email"] },
      where: { email: userVerified.email },
    });

    if (!req.loggedUser) return next(new NotFoundError("User"));

    headers.email = userVerified.email;
    req.loggedUser.dataValues.token = token;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = verifyToken;
