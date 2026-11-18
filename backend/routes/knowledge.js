"use strict";

const express = require("express");
const { Op } = require("sequelize");
const { KnowledgeItem, KnowledgeSource, KnowledgeRelation } = require("../models");
const verifyToken = require("../middleware/authentication");
const router = express.Router();
const sections = ["interview", "architecture", "tools"];
const editableFields = ["section", "kind", "category", "title", "summary", "body", "question", "answer", "difficulty", "questionType", "orderIndex", "estimatedReadingTime", "sourceName", "sourceUrl", "sources", "relations", "tags", "published"];
const relationTypes = ["prerequisite", "related", "alternative", "implements", "depends_on"];

function isKnowledgeAdmin(req) {
  const allowed = (process.env.KNOWLEDGE_ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  return Boolean(req.headers.email && allowed.includes(req.headers.email.toLowerCase()));
}

function validateKnowledgePayload(payload, creating = false) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "Expected a JSON object.";
  const item = Object.fromEntries(editableFields.filter((field) => field in payload).map((field) => [field, payload[field]]));
  if (creating && (!payload.slug || typeof payload.slug !== "string" || payload.slug.length > 180)) return "A slug of up to 180 characters is required.";
  if (creating && ["section", "kind", "category", "title", "summary", "body"].some((field) => !(field in item))) return "Section, kind, category, title, summary and body are required.";
  if (item.section && !sections.includes(item.section)) return "Invalid section.";
  if (item.kind && !["question", "article", "fact", "tip"].includes(item.kind)) return "Invalid kind.";
  if (item.difficulty && !["strong-junior", "middle"].includes(item.difficulty)) return "Invalid difficulty.";
  if ("estimatedReadingTime" in item && (!Number.isInteger(item.estimatedReadingTime) || item.estimatedReadingTime < 1 || item.estimatedReadingTime > 240)) return "estimatedReadingTime must be an integer from 1 to 240.";
  for (const field of ["category", "title", "summary", "body"]) {
    if (field in item && (typeof item[field] !== "string" || !item[field].trim() || item[field].length > (field === "body" ? 50000 : 500))) return `Invalid ${field}.`;
  }
  if (item.sourceUrl && !/^https?:\/\//i.test(item.sourceUrl)) return "sourceUrl must be an HTTP(S) URL.";
  if (item.sources && (!Array.isArray(item.sources) || item.sources.some((source) => !source || typeof source.title !== "string" || typeof source.url !== "string" || source.url.length > 700 || !/^https?:\/\//i.test(source.url)))) return "Sources must be an array of titled HTTP(S) URLs up to 700 characters long.";
  if (item.kind === "article" && ((creating && !item.sources?.length) || (item.sources && !item.sources.length))) return "Articles require at least one source record.";
  if (creating && item.kind !== "article" && (!item.sourceName || !item.sourceUrl)) return "A source name and HTTP(S) source URL are required.";
  if (item.relations && (!Array.isArray(item.relations) || item.relations.some((relation) => !relation || typeof relation.slug !== "string" || relation.slug.length > 180 || !relationTypes.includes(relation.relationType)))) return "Relations must contain a target slug and supported relation type.";
  if (item.tags && (!Array.isArray(item.tags) || item.tags.some((tag) => typeof tag !== "string"))) return "Tags must be an array of strings.";
  return item;
}

async function replaceSourceRecords(item, sources, transaction) {
  await KnowledgeSource.destroy({ where: { knowledgeItemId: item.id }, transaction });
  if (sources?.length) await KnowledgeSource.bulkCreate(sources.map((source) => ({
    knowledgeItemId: item.id, title: source.title, url: source.url,
    type: source.type || "technical", description: source.description || "",
  })), { validate: true, transaction });
}

async function replaceArticleRelations(item, relations, transaction) {
  await KnowledgeRelation.destroy({ where: { sourceArticleId: item.id }, transaction });
  if (!relations?.length) return;
  const targets = await KnowledgeItem.findAll({
    where: { slug: relations.map((relation) => relation.slug), section: "tools", kind: "article", published: true },
    attributes: ["id", "slug"], transaction,
  });
  const targetIds = new Map(targets.map((target) => [target.slug, target.id]));
  if (relations.some((relation) => !targetIds.has(relation.slug) || targetIds.get(relation.slug) === item.id)) {
    throw new Error("Relations must target existing, published technology articles and cannot target the source article.");
  }
  await KnowledgeRelation.bulkCreate(relations.map((relation) => ({
    sourceArticleId: item.id, targetArticleId: targetIds.get(relation.slug), relationType: relation.relationType,
  })), { validate: true, transaction, ignoreDuplicates: true });
}

router.post("/manage", verifyToken, async (req, res, next) => {
  try {
    if (!isKnowledgeAdmin(req)) return res.status(403).json({ errors: { body: ["Knowledge editor access is not configured for this account."] } });
    const data = validateKnowledgePayload(req.body, true);
    if (typeof data === "string") return res.status(400).json({ errors: { body: [data] } });
    const { sources: sourceRecords = [], relations: articleRelations = [], ...itemData } = data;
    const item = await KnowledgeItem.sequelize.transaction(async (transaction) => {
      const created = await KnowledgeItem.create({
        tags: [], ...itemData, slug: req.body.slug,
        sourceName: itemData.sourceName || sourceRecords[0]?.title,
        sourceUrl: itemData.sourceUrl || sourceRecords[0]?.url,
      }, { transaction });
      await replaceSourceRecords(created, sourceRecords, transaction);
      if (created.section === "tools" && created.kind === "article") await replaceArticleRelations(created, articleRelations, transaction);
      return created;
    });
    res.status(201).json({ item });
  } catch (error) { next(error); }
});

router.put("/manage/:slug", verifyToken, async (req, res, next) => {
  try {
    if (!isKnowledgeAdmin(req)) return res.status(403).json({ errors: { body: ["Knowledge editor access is not configured for this account."] } });
    const data = validateKnowledgePayload(req.body);
    if (typeof data === "string") return res.status(400).json({ errors: { body: [data] } });
    const item = await KnowledgeItem.findOne({ where: { slug: req.params.slug } });
    if (!item) return res.status(404).json({ errors: { body: ["Knowledge item not found"] } });
    const { sources: sourceRecords, relations: articleRelations, ...itemData } = data;
    await KnowledgeItem.sequelize.transaction(async (transaction) => {
      await item.update(itemData, { transaction });
      if (sourceRecords) await replaceSourceRecords(item, sourceRecords, transaction);
      if (articleRelations && item.section === "tools" && item.kind === "article") await replaceArticleRelations(item, articleRelations, transaction);
    });
    res.json({ item });
  } catch (error) { next(error); }
});

router.delete("/manage/:slug", verifyToken, async (req, res, next) => {
  try {
    if (!isKnowledgeAdmin(req)) return res.status(403).json({ errors: { body: ["Knowledge editor access is not configured for this account."] } });
    const item = await KnowledgeItem.findOne({ where: { slug: req.params.slug } });
    if (!item) return res.status(404).json({ errors: { body: ["Knowledge item not found"] } });
    await item.destroy();
    res.status(204).end();
  } catch (error) { next(error); }
});

router.get("/categories", async (req, res, next) => {
  try {
    const rows = await KnowledgeItem.findAll({
      where: { published: true }, attributes: ["section", "category"],
      group: ["section", "category"], order: [["section", "ASC"], ["category", "ASC"]], raw: true,
    });
    const categories = rows.reduce((grouped, row) => {
      (grouped[row.section] ||= []).push(row.category);
      return grouped;
    }, {});
    res.json({ categories });
  } catch (error) { next(error); }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const item = await KnowledgeItem.findOne({ where: { slug: req.params.slug, published: true }, include: [
      { model: KnowledgeSource, as: "sourceRecords", attributes: ["title", "url", "type", "description"] },
      { model: KnowledgeRelation, as: "outgoingRelations", attributes: ["relationType"], required: false, include: [{ model: KnowledgeItem, as: "targetArticle", attributes: ["slug", "title", "summary", "category", "orderIndex", "estimatedReadingTime"], where: { published: true }, required: false }] },
    ] });
    if (!item) return res.status(404).json({ errors: { body: ["Knowledge item not found"] } });
    res.json({ item });
  } catch (error) { next(error); }
});

router.get("/", async (req, res, next) => {
  try {
    const { section, kind, search, category, difficulty } = req.query;
    const where = { published: true };
    if (section && sections.includes(section)) where.section = section;
    if (kind && ["fact", "tip", "question", "article"].includes(kind)) where.kind = kind;
    if (category) where.category = String(category).slice(0, 80);
    if (difficulty && ["strong-junior", "middle"].includes(difficulty)) where.difficulty = difficulty;
    if (search && String(search).trim()) {
      const term = `%${String(search).trim().slice(0, 100)}%`;
      where[Op.or] = ["title", "summary", "body", "question", "answer", "category"].map((field) => ({ [field]: { [Op.like]: term } }));
    }
    const items = await KnowledgeItem.findAll({
      where,
      attributes: ["slug", "kind", "section", "category", "title", "summary", "body", "question", "answer", "difficulty", "questionType", "orderIndex", "estimatedReadingTime", "sourceName", "sourceUrl", "tags"],
      include: [
        { model: KnowledgeSource, as: "sourceRecords", attributes: ["title", "url", "type", "description"] },
        { model: KnowledgeRelation, as: "outgoingRelations", attributes: ["relationType"], required: false, include: [{ model: KnowledgeItem, as: "targetArticle", attributes: ["slug", "title", "summary", "category", "orderIndex", "estimatedReadingTime"], where: { published: true }, required: false }] },
      ],
      order: [["orderIndex", "ASC"], ["title", "ASC"]], limit: 500,
    });
    res.json({ items, total: items.length });
  } catch (error) { next(error); }
});

module.exports = router;
