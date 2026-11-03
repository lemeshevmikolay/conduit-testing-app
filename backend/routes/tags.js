const express = require("express");
const router = express.Router();
const { Tag } = require("../models");

// All Tags
router.get("/", async (req, res, next) => {
  try {
    const rows = await Tag.sequelize.query(
      "SELECT t.name FROM Tags t LEFT JOIN TagList tl ON tl.tagName = t.name GROUP BY t.name ORDER BY COUNT(tl.articleId) DESC, t.name ASC LIMIT 20",
      { type: Tag.sequelize.QueryTypes.SELECT },
    );
    const tags = rows.map(({ name }) => name);

    res.json({ tags });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
