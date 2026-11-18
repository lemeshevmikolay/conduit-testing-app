"use strict";

const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

const root = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(root, ".env") });

const snapshotPath = path.join(root, "db-snapshot", "snapshot.sql");
const marker = "-- BEGIN QA Knowledge Hub seed snapshot\n";
const records = require("../backend/seed/knowledge").seedRecords();

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  return `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "''").replace(/\0/g, "\\0")}'`;
}

function rows(values) {
  return values.map((row) => `(${row.map(sql).join(",")})`).join(",\n");
}

const ids = new Map(records.map((record, index) => [record.slug, index + 1]));
const itemRows = records.map((record, index) => [
  index + 1, record.slug, record.kind, record.section, record.category,
  record.difficulty || "middle", record.questionType || null, record.orderIndex,
  record.estimatedReadingTime || null, record.title, record.summary, record.body,
  record.question || null, record.answer || null, record.sourceName,
  record.sourceUrl, JSON.stringify(record.tags || []), record.published === false ? 0 : 1,
  "2026-11-18 00:00:00", "2026-11-18 00:00:00",
]);
const sourceRows = records.flatMap((record) => (record.sources || []).map((source, index) => [
  `${record.slug}:${index}`, ids.get(record.slug), source.title, source.url,
  source.type || "technical", source.description || "",
  "2026-11-18 00:00:00", "2026-11-18 00:00:00",
]));
const toolArticles = records.filter((record) => record.section === "tools" && record.kind === "article");
const toolByOrder = new Map(toolArticles.map((record) => [record.orderIndex + 1, record]));
const relationRows = toolArticles.flatMap((record) => (record.related || []).map((relation) => {
  const target = toolByOrder.get(relation.target);
  return target ? [ids.get(record.slug), ids.get(target.slug), relation.type, "2026-11-18 00:00:00", "2026-11-18 00:00:00"] : null;
}).filter(Boolean));

const fragment = `${marker}-- Generated from backend/seed/knowledge.js by scripts/generate-knowledge-snapshot.js.
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS \`KnowledgeRelations\`;
DROP TABLE IF EXISTS \`KnowledgeSources\`;
DROP TABLE IF EXISTS \`KnowledgeItems\`;

CREATE TABLE \`KnowledgeItems\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`slug\` varchar(180) NOT NULL,
  \`kind\` varchar(20) NOT NULL,
  \`section\` varchar(30) NOT NULL DEFAULT 'architecture',
  \`category\` varchar(80) NOT NULL,
  \`difficulty\` varchar(20) NOT NULL DEFAULT 'middle',
  \`questionType\` varchar(30) DEFAULT NULL,
  \`orderIndex\` int NOT NULL DEFAULT 0,
  \`estimatedReadingTime\` int DEFAULT NULL,
  \`title\` varchar(255) NOT NULL,
  \`summary\` varchar(500) NOT NULL,
  \`body\` longtext NOT NULL,
  \`question\` text,
  \`answer\` longtext,
  \`sourceName\` varchar(180) NOT NULL,
  \`sourceUrl\` varchar(1000) NOT NULL,
  \`tags\` json NOT NULL,
  \`published\` tinyint(1) NOT NULL DEFAULT '1',
  \`createdAt\` datetime NOT NULL,
  \`updatedAt\` datetime NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`KnowledgeItems_slug_unique\` (\`slug\`),
  KEY \`knowledge_items_kind_published\` (\`kind\`,\`published\`),
  KEY \`knowledge_items_category\` (\`category\`),
  KEY \`knowledge_items_section_kind_order\` (\`section\`,\`kind\`,\`orderIndex\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE \`KnowledgeSources\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`knowledgeItemId\` int NOT NULL,
  \`title\` varchar(255) NOT NULL,
  \`url\` varchar(700) NOT NULL,
  \`type\` varchar(40) NOT NULL,
  \`description\` varchar(500) NOT NULL,
  \`createdAt\` datetime NOT NULL,
  \`updatedAt\` datetime NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`knowledge_sources_item_url_unique\` (\`knowledgeItemId\`,\`url\`),
  CONSTRAINT \`knowledge_sources_item_fk\` FOREIGN KEY (\`knowledgeItemId\`) REFERENCES \`KnowledgeItems\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE \`KnowledgeRelations\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`sourceArticleId\` int NOT NULL,
  \`targetArticleId\` int NOT NULL,
  \`relationType\` varchar(24) NOT NULL,
  \`createdAt\` datetime NOT NULL,
  \`updatedAt\` datetime NOT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`knowledge_relations_unique_edge\` (\`sourceArticleId\`,\`targetArticleId\`,\`relationType\`),
  KEY \`knowledge_relations_target_type\` (\`targetArticleId\`,\`relationType\`),
  CONSTRAINT \`knowledge_relations_source_fk\` FOREIGN KEY (\`sourceArticleId\`) REFERENCES \`KnowledgeItems\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`knowledge_relations_target_fk\` FOREIGN KEY (\`targetArticleId\`) REFERENCES \`KnowledgeItems\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO \`KnowledgeItems\` (\`id\`,\`slug\`,\`kind\`,\`section\`,\`category\`,\`difficulty\`,\`questionType\`,\`orderIndex\`,\`estimatedReadingTime\`,\`title\`,\`summary\`,\`body\`,\`question\`,\`answer\`,\`sourceName\`,\`sourceUrl\`,\`tags\`,\`published\`,\`createdAt\`,\`updatedAt\`) VALUES
${rows(itemRows)};

INSERT INTO \`KnowledgeSources\` (\`id\`,\`knowledgeItemId\`,\`title\`,\`url\`,\`type\`,\`description\`,\`createdAt\`,\`updatedAt\`) VALUES
${rows(sourceRows.map((row, index) => [index + 1, ...row.slice(1)]))};

INSERT INTO \`KnowledgeRelations\` (\`sourceArticleId\`,\`targetArticleId\`,\`relationType\`,\`createdAt\`,\`updatedAt\`) VALUES
${rows(relationRows)};
SET FOREIGN_KEY_CHECKS=1;
-- END QA Knowledge Hub seed snapshot
`;

const snapshot = fs.readFileSync(snapshotPath, "utf8");
const markerIndex = snapshot.indexOf(marker);
const base = markerIndex >= 0 ? snapshot.slice(0, markerIndex) : `${snapshot.trimEnd()}\n\n`;
fs.writeFileSync(snapshotPath, `${base}${fragment}`, "utf8");
console.log(`Wrote ${records.length} knowledge items, ${sourceRows.length} sources and ${relationRows.length} relations to db-snapshot/snapshot.sql.`);
