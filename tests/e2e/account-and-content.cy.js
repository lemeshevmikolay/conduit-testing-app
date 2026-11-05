describe("Conduit smoke: account and content", () => {
  const suffix = `${Date.now()}`;
  const username = `reader${suffix}`;
  const email = `${username}@example.test`;
  const password = "ReaderPassword123!";
  const seededEmail = "e2e-reader@example.test";
  const seededPassword = "E2EReaderPass123!";

  const signIn = () => {
    cy.visit("/#/login");
    cy.get('input[name="identifier"]').type(seededEmail);
    cy.get('input[name="password"]').type(seededPassword);
    cy.contains("button", "Sign in").click();
    cy.get(".dropdown-toggle").should("be.visible");
  };

  it("registers an account and verifies its email", () => {
    cy.visit("/#/register");
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('input[name="confirmPassword"]').type(password);
    cy.contains("button", "Sign up").click();

    cy.location("hash").should("include", "finish-registration");
    cy.get('input[name="code"]').type("123456");
    cy.contains("button", "Verify email").click();
    cy.contains(username).should("be.visible");
  });

  it("logs in and logs out", () => {
    signIn();
    cy.get(".dropdown-toggle").click();
    cy.contains("a", "Logout").click();
    cy.contains("a", "Sign in").should("be.visible");
  });

  it("requests a password reset, changes the password, and signs in", () => {
    const nextPassword = `Reset${Date.now()}Aa1!`;
    cy.visit("/#/login");
    cy.contains("a", "Forgot the password?").click();
    cy.contains("h1", "Forgot password").should("be.visible");
    cy.get('input[name="email"]').type("e2e-reset@example.test");
    cy.contains("button", "Send one-time password").click();
    cy.contains("123456").should("be.visible");

    cy.get('input[name="code"]').type("123456");
    cy.get('input[name="password"]').type(nextPassword);
    cy.get('input[name="confirmPassword"]').type(nextPassword);
    cy.contains("button", "Update password").click();
    cy.location("hash").should("include", "login");
    cy.contains("Password updated. Sign in with your new password.").should("be.visible");

    cy.get('input[name="identifier"]').type("e2e-reset@example.test");
    cy.get('input[name="password"]').type(nextPassword);
    cy.contains("button", "Sign in").click();
    cy.contains("e2ereset").should("be.visible");
  });

  it("creates an article, adds and deletes a comment, then deletes the article", () => {
    const title = `E2E lifecycle ${suffix}`;
    const comment = `E2E comment ${suffix}`;

    signIn();
    cy.visit("/#/editor");
    cy.get('input[name="title"]').type(title);
    cy.get('input[name="description"]').type("Article for lifecycle smoke coverage");
    cy.get('textarea[name="body"]').type("This article body is long enough to pass validation rules.");
    cy.contains("button", "Publish Article").click();
    cy.contains("h1", title).should("be.visible");

    cy.get('textarea[placeholder="Write a comment..."]').type(comment);
    cy.contains("button", "Post Comment").click();
    cy.contains('[data-testid="comment-card"]', comment).should("be.visible");
    cy.on("window:confirm", () => true);
    cy.contains('[data-testid="comment-card"]', comment).find('[data-testid="delete-comment"]').click();
    cy.contains(comment).should("not.exist");

    cy.contains("button", "Delete Article").click();
    cy.location("hash").should("eq", "#/");
  });

  it("updates multiple article fields", () => {
    const title = `E2E before update ${suffix}`;
    const updatedTitle = `E2E after update ${suffix}`;
    signIn();
    cy.visit("/#/editor");
    cy.get('input[name="title"]').type(title);
    cy.get('input[name="description"]').type("Original article description");
    cy.get('textarea[name="body"]').type("Original article body with enough characters.");
    cy.get('input[name="tags"]').type("smoke original");
    cy.contains("button", "Publish Article").click();
    cy.contains("h1", title).should("be.visible");

    cy.contains("a", "Edit Article").click();
    cy.get('input[name="title"]').clear().type(updatedTitle);
    cy.get('input[name="description"]').clear().type("Updated article description");
    cy.get('textarea[name="body"]').clear().type("Updated article body with enough characters.");
    cy.get('input[name="tags"]').clear().type("smoke updated");
    cy.contains("button", "Update Article").click();

    cy.contains("h1", updatedTitle).should("be.visible");
    cy.contains("Updated article body with enough characters.").should("be.visible");
    cy.contains('[data-testid="article-tag"]', "#smoke").should("be.visible");
    cy.contains('[data-testid="article-tag"]', "#updated").should("be.visible");

    // The article detail page does not render the description; it appears in previews.
    cy.visit("/#/profile/e2ereader");
    cy.contains(".article-preview", updatedTitle).within(() => {
      cy.contains("p", "Updated article description").should("be.visible");
    });
  });

  it("follows and unfollows an author", () => {
    signIn();
    cy.visit("/#/profile/feedauthor");
    cy.contains('[data-testid="article-preview"]', "Feed seed article").should("be.visible");
    cy.get('[data-testid="follow-button"]').then(($button) => {
      if ($button.text().includes("Unfollow")) cy.wrap($button).click();
    });
    cy.get('[data-testid="follow-button"]').should("contain", "Follow").click();
    cy.get('[data-testid="follow-button"]').should("contain", "Unfollow");
    cy.get('[data-testid="follow-button"]').click();
    cy.get('[data-testid="follow-button"]').should("contain", "Follow");
  });

  it("shows the followed author's article in Your Feed", () => {
    signIn();
    cy.window().then((window) => {
      const auth = JSON.parse(window.localStorage.getItem("loggedUser"));
      return cy.request({
        method: "DELETE",
        url: "http://127.0.0.1:3001/api/profiles/feedauthor/follow",
        headers: auth.headers,
      }).then(() => cy.request({
        method: "POST",
        url: "http://127.0.0.1:3001/api/profiles/feedauthor/follow",
        headers: auth.headers,
      }));
    });

    cy.visit("/#/");
    cy.get('[data-testid="feed-tab-feed"]').click();
    cy.contains("Feed seed article").should("be.visible");
  });

  it("likes and unlikes an article", () => {
    signIn();
    cy.visit("/#/");
    cy.get('[data-testid="feed-tab-global"]').click();
    cy.contains('[data-testid="article-preview"]', "Feed seed article").within(() => {
      cy.get('[data-testid="favorite-button"]').then(($button) => {
        if ($button.attr("data-favorited") === "true") cy.wrap($button).click();
      });
      cy.get('[data-testid="favorite-button"]').should("have.attr", "data-favorited", "false").click();
      cy.get('[data-testid="favorite-button"]').should("have.attr", "data-favorited", "true");
      cy.get('[data-testid="favorite-button"]').click();
      cy.get('[data-testid="favorite-button"]').should("have.attr", "data-favorited", "false");
    });
  });

  it("shows a liked article in the user's favorites profile", () => {
    signIn();
    cy.visit("/#/");
    cy.get('[data-testid="feed-tab-global"]').click();
    cy.contains('[data-testid="article-preview"]', "Feed seed article").within(() => {
      cy.get('[data-testid="favorite-button"]').then(($button) => {
        if ($button.attr("data-favorited") !== "true") cy.wrap($button).click();
      });
      cy.get('[data-testid="favorite-button"]').should("have.attr", "data-favorited", "true");
    });

    cy.visit("/#/profile/e2ereader/favorites");
    cy.contains('[data-testid="article-preview"]', "Feed seed article").should("be.visible");
  });

  it("opens a tag feed and filters articles by that tag", () => {
    cy.visit("/#/");
    cy.contains('[data-testid="popular-tag"]', "#e2e-smoke").click();
    cy.get('[data-testid="feed-tab-tag"]').should("contain", "e2e-smoke");
    cy.contains('[data-testid="article-preview"]', "Feed seed article").should("be.visible");
  });

  it("updates profile settings", () => {
    const bio = `E2E profile bio ${suffix}`;
    const image = "https://example.test/e2e-avatar.png";
    signIn();
    cy.visit("/#/settings");
    cy.get('[data-testid="settings-form"] textarea[name="bio"]').clear().type(bio);
    cy.get('[data-testid="settings-form"] input[name="image"]').clear().type(image);
    cy.get('[data-testid="save-settings"]').click();
    cy.get('[data-testid="settings-success"]').should("contain", "Settings updated.");

    cy.visit("/#/profile/e2ereader");
    cy.contains(bio).should("be.visible");
    cy.get("img.user-img").should("have.attr", "src", image);
  });
});
