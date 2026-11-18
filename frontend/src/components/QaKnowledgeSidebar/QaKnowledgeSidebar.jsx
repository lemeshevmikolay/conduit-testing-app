import { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "markdown-to-jsx";
import { BookOpen, Bookmark, Check, ChevronDown, CircleHelp, FileText, Layers3, LoaderCircle, Search, Shuffle, X } from "lucide-react";
import getKnowledgeItems from "../../services/getKnowledgeItems";

const tabs = [
  { id: "interview", label: "QA Interview", description: "Питання та сценарії для Middle—Senior", icon: CircleHelp },
  { id: "architecture", label: "Architecture & Networking", description: "Як компоненти системи взаємодіють між собою", icon: Layers3 },
  { id: "tools", label: "Tools & Technologies", description: "Проблема, принцип роботи та QA-перевірки", icon: BookOpen },
];
const savedKey = "conduit.qa-knowledge.bookmarks";
const viewedKey = "conduit.qa-knowledge.viewed";
const readList = (key) => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } };

function QuestionCard({ item, expanded, onToggle, viewed, bookmarked, onBookmark, cardRef, randomlySelected }) {
  return <article ref={cardRef} className={`hub-card hub-question${randomlySelected ? " is-random-choice" : ""}`}>
    <div className="hub-card__meta"><span>{item.category}</span><span className="hub-level">{item.difficulty === "strong-junior" ? "Strong Junior" : "Middle"}</span>{viewed && <span className="hub-viewed"><Check size={12} /> Переглянуто</span>}</div>
    <h3>{item.question}</h3>
    <div className="hub-card__actions">
      <button className="hub-text-button" type="button" aria-expanded={expanded} onClick={onToggle}>{expanded ? "Сховати відповідь" : "Показати відповідь"}<ChevronDown size={15} className={expanded ? "is-rotated" : ""} /></button>
      <button className={`hub-icon-button ${bookmarked ? "is-saved" : ""}`} type="button" aria-label={bookmarked ? "Видалити закладку" : "Зберегти закладку"} aria-pressed={bookmarked} onClick={() => onBookmark(item.slug)}><Bookmark size={16} /></button>
    </div>
    <div className={`hub-answer ${expanded ? "is-expanded" : ""}`} aria-hidden={!expanded}><div className="hub-answer__inner"><Markdown options={{ disableParsingRawHTML: true }}>{item.answer || item.body}</Markdown></div></div>
  </article>;
}

function ArticleDetail({ item, bookmarked, onBookmark, onNavigate }) {
  const articleSources = item.sourceRecords?.length ? item.sourceRecords : item.sources;
  const headings = (item.body.match(/^## .+$/gm) || []).map((line, index) => ({ id: `article-section-${index + 1}`, title: line.slice(3) }));
  let headingIndex = 0;
  const markdownOptions = { disableParsingRawHTML: true, overrides: { h2: { component: ({ children, ...props }) => { headingIndex += 1; return <h2 id={`article-section-${headingIndex}`} {...props}>{children}</h2>; } } } };
  const relationLabels = { prerequisite: "Попереднє знання", related: "Пов’язана тема", alternative: "Альтернатива", implements: "Реалізує концепцію", depends_on: "Залежить від" };
  return <article className="hub-detail" key={item.slug}>
    <div className="hub-detail__meta"><span>{item.category} · {String((item.orderIndex ?? 0) + 1).padStart(2, "0")}</span><span>{item.estimatedReadingTime || "—"} хв читання</span><button className={`hub-icon-button ${bookmarked ? "is-saved" : ""}`} type="button" aria-label={bookmarked ? "Видалити закладку" : "Зберегти закладку"} aria-pressed={bookmarked} onClick={() => onBookmark(item.slug)}><Bookmark size={17} /></button></div>
    <h2>{item.title}</h2><p className="hub-detail__summary">{item.summary}</p>
    {!!headings.length && <nav className="hub-article-toc" aria-label="Зміст статті"><strong>Зміст</strong>{headings.map((heading) => <a key={heading.id} href={`#${heading.id}`}>{heading.title}</a>)}</nav>}
    <div className="hub-prose"><Markdown options={markdownOptions}>{item.body}</Markdown></div>
    {!!item.outgoingRelations?.length && <section className="hub-related"><h3>Пов’язані матеріали</h3>{item.outgoingRelations.map(({ relationType, targetArticle }) => targetArticle && <button key={`${relationType}-${targetArticle.slug}`} type="button" onClick={() => onNavigate(targetArticle.slug)}><small>{relationLabels[relationType] || "Пов’язана тема"} · {targetArticle.category}</small><strong>{targetArticle.title}</strong></button>)}</section>}
    {!!articleSources?.length && <section className="hub-sources"><h3>Джерела</h3>{articleSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><span>{source.title}</span><small>{source.type} · {source.description}</small></a>)}</section>}
    {!item.sources?.length && item.sourceUrl && <section className="hub-sources"><h3>Джерело</h3><a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.sourceName}</a></section>}
  </article>;
}

function QaKnowledgeSidebar() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("interview");
  const [activeSlug, setActiveSlug] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [expanded, setExpanded] = useState({});
  const [bookmarks, setBookmarks] = useState(() => readList(savedKey));
  const [viewed, setViewed] = useState(() => readList(viewedKey));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [randomPick, setRandomPick] = useState(null);
  const [randomAnnouncement, setRandomAnnouncement] = useState("");
  const triggerRef = useRef(null);
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const questionRefs = useRef(new Map());
  const randomPickCounter = useRef(0);

  useEffect(() => {
    let mounted = true;
    getKnowledgeItems().then((records) => { if (mounted) { setItems(records); setError(false); } })
      .catch(() => { if (mounted) setError(true); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") { event.stopPropagation(); closeHub(); triggerRef.current?.focus(); }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); };
  }, [open]);

  function closeHub() {
    setOpen(false); setActiveTab("interview"); setActiveSlug(null); setQuery("");
    setCategory(""); setDifficulty(""); setExpanded({});
  }

  const tabItems = useMemo(() => items.filter((item) => item.section === activeTab), [items, activeTab]);
  const allResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("uk");
    return items.filter((item) => {
      const textMatch = !normalized || `${item.category} ${item.title} ${item.summary} ${item.body} ${item.question || ""} ${item.answer || ""}`.toLocaleLowerCase("uk").includes(normalized);
      const categoryMatch = !category || item.category === category;
      const difficultyMatch = !difficulty || item.difficulty === difficulty;
      return textMatch && categoryMatch && difficultyMatch && (normalized ? (!difficulty || item.section === "interview") : item.section === activeTab);
    });
  }, [items, query, category, difficulty, activeTab]);
  const categories = useMemo(() => [...new Set((query.trim() ? items : tabItems).map((item) => item.category))].sort((a, b) => a.localeCompare(b, "uk")), [items, tabItems, query]);
  const currentTab = tabs.find((tab) => tab.id === activeTab);
  const activeArticle = allResults.find((item) => item.slug === activeSlug) || allResults.find((item) => item.kind === "article");
  const isSearching = Boolean(query.trim());

  useEffect(() => {
    if (category && !categories.includes(category)) setCategory("");
  }, [categories, category]);

  useEffect(() => {
    if (!randomPick) return;
    const questionCard = questionRefs.current.get(randomPick.slug);
    if (!questionCard) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    questionCard.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  }, [randomPick, allResults]);

  function registerQuestionCard(slug) {
    return (node) => {
      if (node) questionRefs.current.set(slug, node);
      else questionRefs.current.delete(slug);
    };
  }

  function toggleBookmark(slug) {
    setBookmarks((previous) => {
      const next = previous.includes(slug) ? previous.filter((value) => value !== slug) : [...previous, slug];
      localStorage.setItem(savedKey, JSON.stringify(next)); return next;
    });
  }
  function markViewed(slug) {
    setViewed((previous) => {
      if (previous.includes(slug)) return previous;
      const next = [slug, ...previous].slice(0, 200); localStorage.setItem(viewedKey, JSON.stringify(next)); return next;
    });
  }
  function changeTab(id) { setActiveTab(id); setCategory(""); setDifficulty(""); setQuery(""); setActiveSlug(null); setExpanded({}); }
  function pickRandom() {
    if (loading) {
      setRandomAnnouncement("Питання ще завантажуються. Спробуйте ще раз за мить.");
      return;
    }
    if (error) {
      setRandomAnnouncement("Не вдалося завантажити питання. Спробуйте оновити матеріали.");
      return;
    }
    const questions = items.filter((item) => item.section === "interview");
    if (!questions.length) {
      setRandomAnnouncement("Питань для випадкового вибору поки немає.");
      return;
    }
    const choice = questions[Math.floor(Math.random() * questions.length)];
    setActiveTab("interview"); setCategory(""); setDifficulty(""); setQuery(""); setActiveSlug(null);
    setExpanded({ [choice.slug]: true }); markViewed(choice.slug);
    setRandomPick({ slug: choice.slug, id: ++randomPickCounter.current });
    setRandomAnnouncement(`Випадкове питання: ${choice.question}`);
  }

  return <>
    <button ref={triggerRef} className="qa-knowledge__handle" type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}><span className="qa-knowledge__handle-icon"><BookOpen size={19} /></span><span className="qa-knowledge__handle-label">QA Knowledge Hub</span></button>
    {open && <div className="hub-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { closeHub(); triggerRef.current?.focus(); } }}>
      <section ref={dialogRef} className="hub-dialog" role="dialog" aria-modal="true" aria-labelledby="hub-title" aria-describedby="hub-description">
        <header className="hub-header"><div><span className="hub-eyebrow">CONDUIT · ENGINEERING</span><h1 id="hub-title">QA Knowledge Hub</h1><p id="hub-description">Технічна база для роботи, співбесід і системного мислення QA</p></div><button ref={closeRef} className="hub-close" type="button" aria-label="Закрити Knowledge Hub" onClick={() => { closeHub(); triggerRef.current?.focus(); }}><X size={19} /></button></header>
        <div className="hub-tabs" role="tablist" aria-label="Розділи бази знань">{tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" id={`hub-tab-${id}`} aria-controls="hub-panel" aria-selected={activeTab === id} tabIndex={activeTab === id ? 0 : -1} className={activeTab === id ? "is-active" : ""} onClick={() => changeTab(id)} onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); const direction = event.key === "ArrowRight" ? 1 : -1; const index = tabs.findIndex((tab) => tab.id === activeTab); const next = tabs[(index + direction + tabs.length) % tabs.length]; changeTab(next.id); document.getElementById(`hub-tab-${next.id}`)?.focus(); } }}><Icon size={16} /><span>{label}</span></button>)}</div>
        <div className="hub-toolbar"><label className="hub-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Пошук по базі знань</span><input value={query} onChange={(event) => { setQuery(event.target.value); setActiveSlug(null); }} placeholder="Шукати питання, тему або технологію…" /></label>
          <label className="hub-filter"><span className="sr-only">Фільтр категорії</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Усі категорії</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
          {activeTab === "interview" && <label className="hub-filter"><span className="sr-only">Фільтр складності</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="">Усі рівні</option><option value="strong-junior">Strong Junior</option><option value="middle">Middle</option></select></label>}
          {activeTab === "interview" && <><button className="hub-random" type="button" onClick={pickRandom}><Shuffle size={15} /><span>Випадкове питання</span></button>{randomAnnouncement && !randomAnnouncement.startsWith("Випадкове питання:") && <span className="hub-random-status" aria-hidden="true">{randomAnnouncement}</span>}<span className="sr-only" aria-live="polite" aria-atomic="true">{randomAnnouncement}</span></>}
        </div>
        <main id="hub-panel" className="hub-content" role="tabpanel" aria-labelledby={`hub-tab-${activeTab}`}>
          <div className="hub-content__intro"><div><h2>{currentTab?.label}</h2><p>{currentTab?.description}</p></div><span className="hub-count">{allResults.length} матеріалів</span></div>
          {loading ? <div className="hub-state"><LoaderCircle className="hub-spinner" size={22} />Завантажуємо матеріали з бази знань…</div>
            : error ? <div className="hub-state hub-state--error"><h3>Не вдалося завантажити матеріали</h3><p>Перевірте з’єднання та спробуйте ще раз.</p><button type="button" onClick={() => { setLoading(true); setError(false); getKnowledgeItems().then(setItems).catch(() => setError(true)).finally(() => setLoading(false)); }}>Спробувати знову</button></div>
            : !allResults.length ? <div className="hub-state"><Search size={23} /><h3>Нічого не знайдено</h3><p>Змініть пошуковий запит або фільтри.</p></div>
            : isSearching ? <div className="hub-search-results">{allResults.map((item) => item.section === "interview" ? <QuestionCard key={item.slug} item={item} cardRef={registerQuestionCard(item.slug)} randomlySelected={randomPick?.slug === item.slug} expanded={Boolean(expanded[item.slug])} viewed={viewed.includes(item.slug)} bookmarked={bookmarks.includes(item.slug)} onBookmark={toggleBookmark} onToggle={() => { setExpanded((previous) => ({ ...previous, [item.slug]: !previous[item.slug] })); if (!expanded[item.slug]) markViewed(item.slug); }} /> : <button key={item.slug} className="hub-search-result" type="button" onClick={() => { setActiveTab(item.section); setCategory(""); setDifficulty(""); setQuery(""); setActiveSlug(item.slug); markViewed(item.slug); }}><span>{item.section === "architecture" ? "Architecture & Networking" : "Tools & Technologies"} · {item.category}</span><strong>{item.title}</strong><small>{item.summary}</small></button>)}</div>
            : activeTab === "interview" ? <div className="hub-question-list">{allResults.map((item) => <QuestionCard key={item.slug} item={item} cardRef={registerQuestionCard(item.slug)} randomlySelected={randomPick?.slug === item.slug} expanded={Boolean(expanded[item.slug])} viewed={viewed.includes(item.slug)} bookmarked={bookmarks.includes(item.slug)} onBookmark={toggleBookmark} onToggle={() => { setExpanded((previous) => ({ ...previous, [item.slug]: !previous[item.slug] })); if (!expanded[item.slug]) markViewed(item.slug); }} />)}</div>
            : <div className="hub-library"><nav className="hub-library__nav" aria-label={`${currentTab?.label} articles`}>{allResults.map((item, index) => <button key={item.slug} type="button" className={`hub-library__item ${activeArticle?.slug === item.slug ? "is-active" : ""}`} onClick={() => { setActiveSlug(item.slug); markViewed(item.slug); }}><span>{String(index + 1).padStart(2, "0")} · {item.category}</span><strong>{item.title}</strong><small>{item.summary}</small><em>{item.difficulty === "middle" ? "Middle+" : item.difficulty} · {item.estimatedReadingTime || "—"} хв</em><FileText size={15} /></button>)}</nav>{activeArticle ? <ArticleDetail item={activeArticle} bookmarked={bookmarks.includes(activeArticle.slug)} onBookmark={toggleBookmark} onNavigate={(slug) => { setActiveSlug(slug); markViewed(slug); }} /> : <div className="hub-state">Оберіть статтю зі списку.</div>}</div>}
        </main>
        <footer className="hub-footer"><span><Bookmark size={14} /> {bookmarks.length} закладок</span><span>{viewed.length} переглянутих матеріалів</span><span>Вміст завантажено з бази даних</span></footer>
      </section>
    </div>}
  </>;
}

export default QaKnowledgeSidebar;
