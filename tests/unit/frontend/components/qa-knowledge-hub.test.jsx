import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import getKnowledgeItems from "../../../../frontend/src/services/getKnowledgeItems";
import QaKnowledgeSidebar from "../../../../frontend/src/components/QaKnowledgeSidebar/QaKnowledgeSidebar";

vi.mock("../../../../frontend/src/services/getKnowledgeItems", () => ({ default: vi.fn() }));

const items = [
  { slug: "interview-http-1", kind: "question", section: "interview", category: "HTTP / HTTPS", title: "Помилка шлюзу 502", question: "Як локалізувати помилку 502, отриману від шлюзу?", answer: "Перевірте DNS, з'єднання, TLS та доступність upstream-компонента.", body: "", difficulty: "middle", orderIndex: 0, sources: [] },
  { slug: "architecture-dns-1", kind: "article", section: "architecture", category: "Networking", title: "DNS resolution", summary: "How names resolve to addresses.", body: "## Resolution\nA resolver queries DNS records.", orderIndex: 0, sourceRecords: [{ title: "RFC 1034", url: "https://www.rfc-editor.org/rfc/rfc1034.html", type: "standard", description: "DNS concepts" }] },
  { slug: "tools-redis-1", kind: "article", section: "tools", category: "Caching", title: "Redis cache", summary: "Cache invalidation and TTL.", body: "## QA perspective\nTest expiry and stale data.", orderIndex: 0, sourceRecords: [{ title: "Redis Docs", url: "https://redis.io/docs/", type: "official", description: "Redis reference" }] },
];

describe("QA Knowledge Hub", () => {
  beforeEach(() => {
    const store = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, String(value)),
      clear: () => store.clear(),
    });
    localStorage.clear();
    getKnowledgeItems.mockResolvedValue(items);
    document.body.style.overflow = "";
  });

  it("shows three sections, loads section articles and lists their source", async () => {
    const user = userEvent.setup();
    render(<QaKnowledgeSidebar />);
    await user.click(screen.getByRole("button", { name: "QA Knowledge Hub" }));
    const dialog = screen.getByRole("dialog", { name: "QA Knowledge Hub" });
    expect(document.body.style.overflow).toBe("hidden");
    expect(within(dialog).getAllByRole("tab")).toHaveLength(3);

    await user.click(within(dialog).getByRole("tab", { name: "Architecture & Networking" }));
    expect(within(dialog).getByRole("heading", { name: "DNS resolution" })).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: /RFC 1034/ })).toHaveAttribute("href", "https://www.rfc-editor.org/rfc/rfc1034.html");
  });

  it("renders the technology reading route with reading time, contents, sources and related navigation", async () => {
    const user = userEvent.setup();
    const enriched = [
      ...items.map((item) => item.section === "tools" ? {
        ...item,
        estimatedReadingTime: 4,
        outgoingRelations: [{ relationType: "related", targetArticle: { slug: "tools-cache-2", title: "Cache invalidation", category: "Caching", summary: "Cache consistency" } }],
      } : item),
      { slug: "tools-cache-2", kind: "article", section: "tools", category: "Caching", title: "Cache invalidation", summary: "Cache consistency", body: "## Invalidating data\nAn updated value must become visible.", orderIndex: 1, estimatedReadingTime: 2, sourceRecords: [] },
    ];
    getKnowledgeItems.mockResolvedValue(enriched);
    render(<QaKnowledgeSidebar />);
    await user.click(screen.getByRole("button", { name: "QA Knowledge Hub" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("tab", { name: "Tools & Technologies" }));
    expect(within(dialog).getByText("4 хв читання")).toBeInTheDocument();
    expect(within(dialog).getByRole("navigation", { name: "Зміст статті" })).toHaveTextContent("QA perspective");
    expect(within(dialog).getByRole("link", { name: /Redis Docs/ })).toHaveAttribute("href", "https://redis.io/docs/");
    await user.click(dialog.querySelector(".hub-related button"));
    expect(within(dialog).getByRole("heading", { name: "Cache invalidation" })).toBeInTheDocument();
  });

  it("reveals interview answers, filters by difficulty and searches other sections", async () => {
    const user = userEvent.setup();
    render(<QaKnowledgeSidebar />);
    await user.click(screen.getByRole("button", { name: "QA Knowledge Hub" }));
    const dialog = screen.getByRole("dialog");
    const question = within(dialog).getByText("Як локалізувати помилку 502, отриману від шлюзу?").closest("article");
    await user.click(within(question).getByRole("button", { name: "Показати відповідь" }));
    expect(within(question).getByText(/Перевірте DNS/)).toBeInTheDocument();
    await user.selectOptions(within(dialog).getByLabelText("Фільтр складності"), "strong-junior");
    expect(within(dialog).getByText("Нічого не знайдено")).toBeInTheDocument();
    await user.selectOptions(within(dialog).getByLabelText("Фільтр складності"), "");
    await user.type(within(dialog).getByLabelText("Пошук по базі знань"), "Redis cache");
    await waitFor(() => expect(within(dialog).getByRole("button", { name: /Tools & Technologies/ })).toBeInTheDocument());
    await user.click(within(dialog).getByRole("button", { name: /Tools & Technologies/ }));
    expect(within(dialog).getByRole("heading", { name: "Redis cache" })).toBeInTheDocument();
  });

  it("closes with Escape and backdrop click while restoring page scroll", async () => {
    const user = userEvent.setup();
    render(<QaKnowledgeSidebar />);
    const trigger = screen.getByRole("button", { name: "QA Knowledge Hub" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    fireEvent.mouseDown(document.querySelector(".hub-backdrop"), { target: document.querySelector(".hub-backdrop") });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
