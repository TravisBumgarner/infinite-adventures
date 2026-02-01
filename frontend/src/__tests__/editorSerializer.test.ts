import type { Note } from "shared";
import { describe, expect, it } from "vitest";
import { contentToHtml, serializeToMentionText } from "../utils/editorSerializer";

// Helper to build a TipTap paragraph with inline content
function paragraph(...content: Record<string, unknown>[]) {
  return { type: "paragraph", content };
}

function textNode(text: string) {
  return { type: "text", text };
}

function boldTextNode(text: string) {
  return { type: "text", text, marks: [{ type: "bold" }] };
}

function italicTextNode(text: string) {
  return { type: "text", text, marks: [{ type: "italic" }] };
}

function mentionNode(id: string, label: string) {
  return { type: "mention", attrs: { id, label } };
}

function bulletList(...items: string[]) {
  return {
    type: "bulletList",
    content: items.map((text) => ({
      type: "listItem",
      content: [paragraph(textNode(text))],
    })),
  };
}

function orderedList(...items: string[]) {
  return {
    type: "orderedList",
    content: items.map((text) => ({
      type: "listItem",
      content: [paragraph(textNode(text))],
    })),
  };
}

function doc(...content: Record<string, unknown>[]) {
  return { type: "doc", content };
}

describe("serializeToMentionText", () => {
  it("serializes plain text paragraphs", () => {
    const json = doc(paragraph(textNode("Hello world")));
    expect(serializeToMentionText(json)).toBe("Hello world");
  });

  it("serializes multiple paragraphs with newlines", () => {
    const json = doc(paragraph(textNode("Line one")), paragraph(textNode("Line two")));
    expect(serializeToMentionText(json)).toBe("Line one\nLine two");
  });

  it("serializes mentions as @{id}", () => {
    const json = doc(
      paragraph(
        textNode("Talk to "),
        mentionNode("abc-123", "Gandalf"),
        textNode(" about the ring"),
      ),
    );
    expect(serializeToMentionText(json)).toBe("Talk to @{abc-123} about the ring");
  });

  it("serializes bold text as **text**", () => {
    const json = doc(paragraph(textNode("This is "), boldTextNode("important"), textNode(" text")));
    expect(serializeToMentionText(json)).toBe("This is **important** text");
  });

  it("serializes italic text as *text*", () => {
    const json = doc(
      paragraph(textNode("This is "), italicTextNode("emphasized"), textNode(" text")),
    );
    expect(serializeToMentionText(json)).toBe("This is *emphasized* text");
  });

  it("serializes bullet list items with - prefix", () => {
    const json = doc(bulletList("First item", "Second item"));
    expect(serializeToMentionText(json)).toBe("- First item\n- Second item");
  });

  it("serializes ordered list items with numbered prefix", () => {
    const json = doc(orderedList("Step one", "Step two", "Step three"));
    expect(serializeToMentionText(json)).toBe("1. Step one\n2. Step two\n3. Step three");
  });

  it("serializes empty document", () => {
    const json = doc();
    expect(serializeToMentionText(json)).toBe("");
  });

  it("serializes empty paragraphs as blank lines", () => {
    const json = doc(paragraph(textNode("Before")), paragraph(), paragraph(textNode("After")));
    expect(serializeToMentionText(json)).toBe("Before\n\nAfter");
  });
});

const makeCache = (...notes: { id: string; title: string }[]) => {
  const cache = new Map<string, Note>();
  for (const n of notes) {
    cache.set(n.id, {
      id: n.id,
      title: n.title,
      type: "npc",
      content: "",
      canvas_x: 0,
      canvas_y: 0,
      created_at: "",
      updated_at: "",
      links_to: [],
      linked_from: [],
    });
  }
  return cache;
};

describe("contentToHtml", () => {
  it("returns empty paragraph for empty content", () => {
    const result = contentToHtml("", new Map());
    expect(result).toBe("<p></p>");
  });

  it("wraps plain text in paragraph tags", () => {
    const result = contentToHtml("Hello world", new Map());
    expect(result).toContain("<p>Hello world</p>");
  });

  it("converts @{id} mentions to mention spans", () => {
    const cache = makeCache({ id: "abc", title: "Gandalf" });
    const result = contentToHtml("Talk to @{abc}", cache);
    expect(result).toContain('data-type="mention"');
    expect(result).toContain('data-id="abc"');
    expect(result).toContain("@Gandalf");
  });

  it("converts **bold** to strong tags", () => {
    const result = contentToHtml("This is **important** text", new Map());
    expect(result).toContain("<strong>important</strong>");
  });

  it("converts *italic* to em tags", () => {
    const result = contentToHtml("This is *emphasized* text", new Map());
    expect(result).toContain("<em>emphasized</em>");
  });

  it("converts bullet list lines (- prefix) to ul/li", () => {
    const result = contentToHtml("- First\n- Second", new Map());
    expect(result).toContain("<ul>");
    expect(result).toContain("<li>First</li>");
    expect(result).toContain("<li>Second</li>");
    expect(result).toContain("</ul>");
  });

  it("converts ordered list lines (1. prefix) to ol/li", () => {
    const result = contentToHtml("1. Step one\n2. Step two", new Map());
    expect(result).toContain("<ol>");
    expect(result).toContain("<li>Step one</li>");
    expect(result).toContain("<li>Step two</li>");
    expect(result).toContain("</ol>");
  });

  it("handles multiple newlines as separate paragraphs", () => {
    const result = contentToHtml("First\nSecond", new Map());
    expect(result).toContain("<p>First</p>");
    expect(result).toContain("<p>Second</p>");
  });

  it("escapes HTML in content", () => {
    const result = contentToHtml("<script>alert('xss')</script>", new Map());
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });
});
