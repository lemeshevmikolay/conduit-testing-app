const viewports = [
  { name: "desktop", width: 1280, height: 720 },
  { name: "tablet", width: 768, height: 720 },
  { name: "mobile", width: 390, height: 720 },
];

const article = {
  slug: "visual-seed-article",
  title: "A stable article for visual regression",
  description: "Predictable article content used for browser screenshot comparison.",
  body: "A stable body with enough content to exercise article typography and spacing.\n\n- First item\n- Second item",
  tagList: ["visual", "testing"],
  createdAt: "2025-01-15T12:00:00.000Z",
  updatedAt: "2025-01-15T12:00:00.000Z",
  favoritesCount: 7,
  favorited: false,
  author: { username: "visualauthor", bio: "A profile used for stable visual checks.", image: null, following: false, followersCount: 12 },
};
const articleList = { articles: [article], articlesCount: 1 };
const user = { username: "visualreader", email: "visual-reader@example.test", bio: "A predictable test profile.", image: null, token: "visual-test-token" };
const authState = { headers: { Authorization: "Token visual-test-token" }, isAuth: true, loggedUser: user };

function installFixtures() {
  cy.intercept("GET", "**/api/**", (request) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/api/tags")) {
      request.reply({ body: { tags: ["visual", "testing", "accessibility", "design"] } });
    } else if (url.pathname.endsWith("/api/user")) {
      request.reply({ body: { user } });
    } else if (url.pathname.includes("/api/profiles/")) {
      request.reply({ body: { profile: { ...article.author, username: "visualreader", following: false } } });
    } else if (url.pathname.endsWith("/comments")) {
      request.reply({ body: { comments: [{ id: 31, body: "A stable sample comment.", createdAt: "2025-01-15T12:00:00.000Z", author: article.author }] } });
    } else if (url.pathname.endsWith(`/${article.slug}`)) {
      request.reply({ body: { article } });
    } else {
      request.reply({ body: articleList });
    }
  });
}

function stabilizeAndWait({ loading = false } = {}) {
  cy.get("body").should("be.visible");
  cy.get(".route-loading").should("not.exist");
  if (!loading) cy.get('[aria-busy="true"]').should("not.exist");
  cy.document().then((document) => {
    const style = document.createElement("style");
    style.dataset.visualStability = "true";
    style.textContent = `
      *, *::before, *::after { animation-delay: 0s !important; animation-duration: 0s !important; transition-delay: 0s !important; transition-duration: 0s !important; scroll-behavior: auto !important; caret-color: transparent !important; }
      html, body, body * { font-family: Arial, sans-serif !important; }
      i[class*="ion-"]::before { content: none !important; }
      html { scroll-behavior: auto !important; }
    `;
    document.head.appendChild(style);
    return document.fonts?.ready;
  });
  cy.wait(100);
}

function capture(name, { path, viewport, authenticated = false, loading = false, action } = {}) {
  const [pathname, hash = ""] = path.split("#");
  const visitPath = `${pathname}?visual-case=${encodeURIComponent(name)}${hash ? `#${hash}` : ""}`;
  cy.visit(visitPath, {
    onBeforeLoad(window) {
      window.Date = class extends Date {
        constructor(...args) { super(...(args.length ? args : ["2025-01-15T12:00:00.000Z"])); }
        static now() { return new Date("2025-01-15T12:00:00.000Z").getTime(); }
      };
      window.localStorage.removeItem("loggedUser");
      if (authenticated) window.localStorage.setItem("loggedUser", JSON.stringify(authState));
    },
  });
  if (viewport) {
    cy.window().its("innerWidth").should("eq", viewport.width);
    cy.window().its("innerHeight").should("eq", viewport.height);
  }
  stabilizeAndWait({ loading });
  if (action) action();
  cy.screenshot(`visual/${name}`, { capture: "viewport", disableTimersAndAnimations: true });
  cy.task("compareVisual", { name, actualPath: `visual/${name}.png` }).then((result) => {
    expect(result.status, `${name}: ${result.status}, changed pixels: ${result.diffPixels || 0}, ratio: ${result.ratio || 0}`).to.be.oneOf([
      "passed", "baseline-created", "baseline-updated",
    ]);
  });
}

describe("Visual regression: stable routes and interaction states", () => {
  beforeEach(() => installFixtures());

  it("captures the main routes at desktop, tablet, and mobile sizes", () => {
    const pages = [
      { key: "home", path: "/#/" },
      { key: "login", path: "/#/login" },
      { key: "register", path: "/#/register" },
      { key: "article", path: `/#/article/${article.slug}` },
      { key: "editor", path: "/#/editor", authenticated: true },
      { key: "profile", path: "/#/profile/visualreader", authenticated: true },
      { key: "favorites", path: "/#/profile/visualreader/favorites", authenticated: true },
      { key: "settings", path: "/#/settings", authenticated: true },
    ];

    for (const viewport of viewports) {
      cy.viewport(viewport.width, viewport.height);
      for (const page of pages) {
        capture(`${page.key}-${viewport.name}`, { path: page.path, viewport, authenticated: page.authenticated });
      }
    }
  });

  it("captures open navigation and form validation states", () => {
    for (const viewport of viewports) {
      cy.viewport(viewport.width, viewport.height);
      cy.intercept("GET", "**/api/articles*", { delay: 1200, body: articleList }).as("visualLoadingArticles");
      capture(`home-loading-${viewport.name}`, { path: "/#/", viewport, loading: true });
      cy.wait("@visualLoadingArticles");
      capture(`account-menu-${viewport.name}`, {
        path: "/#/",
        viewport,
        authenticated: true,
        action: () => cy.get(".dropdown-toggle").click().get(".dropdown-menu").should("be.visible"),
      });
      capture(`login-validation-${viewport.name}`, {
        path: "/#/login",
        viewport,
        action: () => cy.contains("button", "Sign in").click().get("#identifier-error").should("be.visible"),
      });
    }
  });
});
