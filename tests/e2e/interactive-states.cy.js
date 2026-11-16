describe("Interactive states and narrow viewports", () => {
  const email = "e2e-reader@example.test";
  const password = "E2EReaderPass123!";

  it("keeps navigation within the viewport and opens/closes the account menu by keyboard", () => {
    for (const width of [320, 360, 375, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920]) {
      cy.viewport(width, 800);
      cy.visit("/#/");
      cy.document().its("documentElement.scrollWidth").should("be.lte", width);
      cy.get("body").its("0.scrollWidth").should("be.lte", width);
    }

    cy.viewport(375, 800);
    cy.visit("/#/login");
    cy.get('input[name="identifier"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.contains("button", "Sign in").click();
    cy.get(".dropdown-toggle").should("be.visible").click();
    cy.get(".dropdown-menu").should("be.visible");
    cy.get(".dropdown-menu a").first().focus().type("{esc}");
    cy.get(".dropdown-menu").should("not.exist");
    cy.get(".dropdown-toggle").should("have.focus");
  });

  it("shows inline validation and retains usable controls on small screens", () => {
    cy.viewport(320, 800);
    cy.visit("/#/login");
    cy.contains("button", "Sign in").click();
    cy.get("#identifier-error").should("be.visible");
    cy.get("#password-error").should("be.visible");
    cy.get("input[name=identifier]").should("have.attr", "aria-invalid", "true");
    cy.get("button").filter(":visible").each(($button) => {
      expect($button[0].getBoundingClientRect().right).to.be.lte(320);
    });
  });

  it("exposes comment submit loading, success, and error states without losing text", () => {
    cy.viewport(390, 844);
    cy.visit("/#/login");
    cy.get('input[name="identifier"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.contains("button", "Sign in").click();
    cy.get(".dropdown-toggle").should("be.visible");
    cy.location("hash").should("eq", "#/profile/e2ereader");
    const title = `Interactive states ${Date.now()}`;
    cy.visit("/#/editor");
    cy.get('input[name="title"]').type(title);
    cy.get('input[name="description"]').type("Article for comment state testing");
    cy.get('textarea[aria-label="Article body in Markdown"]').type("A sufficiently long body for interactive state testing.");
    cy.contains("button", "Publish Article").click();
    cy.contains("h1", title).should("be.visible");

    cy.intercept("POST", "**/api/articles/*/comments", {
      delay: 1500,
      statusCode: 201,
      body: { comment: { id: 9001, body: "A delayed interactive state comment.", author: { username: "e2ereader" } } },
    }).as("postComment");
    cy.get('textarea[aria-label="Write a comment"]').type("A delayed interactive state comment.");
    cy.contains("button", "Post Comment").click();
    cy.contains("button", "Posting…").should("be.disabled");
    cy.wait("@postComment").its("response.statusCode").should("eq", 201);
    cy.get('textarea[aria-label="Write a comment"]').should("have.value", "");

    cy.intercept("POST", "**/api/articles/*/comments", { statusCode: 500, body: { errors: { body: ["Temporary failure"] } } });
    cy.get('textarea[aria-label="Write a comment"]').type("Keep this text if posting fails.");
    cy.contains("button", "Post Comment").click();
    cy.get(".interaction-error").should("be.visible");
    cy.get('textarea[aria-label="Write a comment"]').should("have.value", "Keep this text if posting fails.");
  });
});
