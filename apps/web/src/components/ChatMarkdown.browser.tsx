import "../index.css";

import { page } from "vitest/browser";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

const { openInPreferredEditorMock, readLocalApiMock } = vi.hoisted(() => ({
  openInPreferredEditorMock: vi.fn(async () => "vscode"),
  readLocalApiMock: vi.fn(() => ({
    server: { getConfig: vi.fn(async () => ({ availableEditors: ["vscode"] })) },
    shell: { openInEditor: vi.fn(async () => undefined) },
  })),
}));

vi.mock("../editorPreferences", () => ({
  openInPreferredEditor: openInPreferredEditorMock,
}));

vi.mock("../localApi", () => ({
  ensureLocalApi: vi.fn(() => {
    throw new Error("ensureLocalApi not implemented in browser test");
  }),
  readLocalApi: readLocalApiMock,
}));

import ChatMarkdown from "./ChatMarkdown";

describe("ChatMarkdown", () => {
  afterEach(() => {
    openInPreferredEditorMock.mockClear();
    readLocalApiMock.mockClear();
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("rewrites file uri hrefs into direct paths before rendering", async () => {
    const filePath =
      "/Users/yashsingh/p/sco/claude-code-extract/src/utils/permissions/PermissionRule.ts";
    const screen = await render(
      <ChatMarkdown text={`[PermissionRule.ts](file://${filePath})`} cwd="/repo/project" />,
    );

    try {
      const link = page.getByRole("link", { name: "PermissionRule.ts" });
      await expect.element(link).toBeInTheDocument();
      await expect.element(link).toHaveAttribute("href", filePath);

      await link.click();

      await vi.waitFor(() => {
        expect(openInPreferredEditorMock).toHaveBeenCalledWith(expect.anything(), filePath);
      });
    } finally {
      await screen.unmount();
    }
  });

  it("keeps line anchors working after rewriting file uri hrefs", async () => {
    const filePath =
      "/Users/yashsingh/p/sco/claude-code-extract/src/utils/permissions/PermissionRule.ts";
    const screen = await render(
      <ChatMarkdown text={`[PermissionRule.ts:1](file://${filePath}#L1)`} cwd="/repo/project" />,
    );

    try {
      const link = page.getByRole("link", { name: "PermissionRule.ts · L1" });
      await expect.element(link).toBeInTheDocument();
      await expect.element(link).toHaveAttribute("href", `${filePath}:1`);

      await link.click();

      await vi.waitFor(() => {
        expect(openInPreferredEditorMock).toHaveBeenCalledWith(expect.anything(), `${filePath}:1`);
      });
    } finally {
      await screen.unmount();
    }
  });

  it("shows column information inline when present", async () => {
    const filePath =
      "/Users/yashsingh/p/sco/claude-code-extract/src/utils/permissions/PermissionRule.ts";
    const screen = await render(
      <ChatMarkdown text={`[PermissionRule.ts](file://${filePath}#L1C7)`} cwd="/repo/project" />,
    );

    try {
      const link = page.getByRole("link", { name: "PermissionRule.ts · L1:C7" });
      await expect.element(link).toBeInTheDocument();
      await expect.element(link).toHaveAttribute("href", `${filePath}:1:7`);

      await link.click();

      await vi.waitFor(() => {
        expect(openInPreferredEditorMock).toHaveBeenCalledWith(
          expect.anything(),
          `${filePath}:1:7`,
        );
      });
    } finally {
      await screen.unmount();
    }
  });

  it("disambiguates duplicate file basenames inline", async () => {
    const firstPath = "/Users/yashsingh/p/t3code/apps/web/src/components/chat/MessagesTimeline.tsx";
    const secondPath = "/Users/yashsingh/p/t3code/apps/web/src/components/MessagesTimeline.tsx";
    const screen = await render(
      <ChatMarkdown
        text={`See [MessagesTimeline.tsx](file://${firstPath}) and [MessagesTimeline.tsx](file://${secondPath}).`}
        cwd="/repo/project"
      />,
    );

    try {
      await expect
        .element(page.getByRole("link", { name: "MessagesTimeline.tsx · components/chat" }))
        .toBeInTheDocument();
      await expect
        .element(page.getByRole("link", { name: "MessagesTimeline.tsx · src/components" }))
        .toBeInTheDocument();
    } finally {
      await screen.unmount();
    }
  });

  it("keeps normal web links unchanged", async () => {
    const screen = await render(
      <ChatMarkdown text="[OpenAI](https://openai.com/docs)" cwd="/repo/project" />,
    );

    try {
      const link = page.getByRole("link", { name: "OpenAI" });
      await expect.element(link).toBeInTheDocument();
      await expect.element(link).toHaveAttribute("href", "https://openai.com/docs");
      await expect.element(link).toHaveAttribute("target", "_blank");
    } finally {
      await screen.unmount();
    }
  });

  it("renders supported Mermaid flowcharts instead of plain code blocks", async () => {
    const screen = await render(
      <ChatMarkdown
        text={`\`\`\`mermaid
flowchart LR
  Compound["AF710B"] --> Receptor["M1 receptor"]
  Receptor -- "positive allosteric modulation" --> Cognition["cognitive domain"]
\`\`\``}
        cwd="/repo/project"
      />,
    );

    try {
      await expect.element(page.getByText("Flow chart")).toBeInTheDocument();
      await expect.element(page.getByTitle("AF710B")).toBeInTheDocument();
      await expect.element(page.getByTitle("M1 receptor")).toBeInTheDocument();
      await expect.element(page.getByTitle("cognitive domain")).toBeInTheDocument();
      await expect.element(page.getByText(/positive allosteric modulation/)).toBeInTheDocument();
      await expect.element(page.getByText(/AF710B ->/)).not.toBeInTheDocument();
    } finally {
      await screen.unmount();
    }
  });

  it("renders common Mermaid edge variants without exposing raw syntax", async () => {
    const screen = await render(
      <ChatMarkdown
        text={`\`\`\`mermaid
graph TD
  A["AF710B"] -- PAM-like --> B["M1 receptor"]
  B -. "uncertain translation" .-> C["human cognition"]
\`\`\``}
        cwd="/repo/project"
      />,
    );

    try {
      await expect.element(page.getByText("Flow chart")).toBeInTheDocument();
      await expect.element(page.getByTitle("AF710B")).toBeInTheDocument();
      await expect.element(page.getByTitle("M1 receptor")).toBeInTheDocument();
      await expect.element(page.getByTitle("human cognition")).toBeInTheDocument();
      await expect.element(page.getByText("PAM-like")).toBeInTheDocument();
      await expect.element(page.getByText("uncertain translation")).toBeInTheDocument();
      await expect.element(page.getByText(/A\\["AF710B"\\]/)).not.toBeInTheDocument();
    } finally {
      await screen.unmount();
    }
  });

  it("renders target_network neuropharm graph blocks as network panels", async () => {
    const screen = await render(
      <ChatMarkdown
        text={`\`\`\`neuropharm-graph
{"kind":"target_network","title":"AF710B target map","data":[{"label":"M1 / CHRM1","value":82,"group":"AF710B","unit":"measured"},{"label":"SIGMAR1","value":60,"group":"AF710B","unit":"inferred"}],"notes":["Local rows first; literature second."]}
\`\`\``}
        cwd="/repo/project"
      />,
    );

    try {
      await expect.element(page.getByText("AF710B target map")).toBeInTheDocument();
      await expect
        .element(page.getByText("Compound / target / evidence-strength network"))
        .toBeInTheDocument();
      await expect.element(page.getByTitle("AF710B")).toBeInTheDocument();
      await expect.element(page.getByTitle("M1 / CHRM1")).toBeInTheDocument();
      await expect.element(page.getByTitle("SIGMAR1")).toBeInTheDocument();
      await expect
        .element(page.getByText("Local rows first; literature second."))
        .toBeInTheDocument();
    } finally {
      await screen.unmount();
    }
  });

  it("auto-renders standardized neuropharm graph blocks", async () => {
    const screen = await render(
      <ChatMarkdown
        text={`\`\`\`neuropharm-graph
{"kind":"receptor_selectivity_radar","title":"AF710B receptor selectivity","data":[{"label":"M1","value":82,"group":"AF710B"},{"label":"SIGMAR1","value":64,"group":"AF710B"},{"label":"DAT","value":12,"group":"AF710B"}],"notes":["Normalized 0-100 mechanism panel."]}
\`\`\`

\`\`\`neuropharm-graph
{"kind":"interaction_risk_heatmap","title":"Stack risk matrix","data":[{"label":"BP","value":70,"group":"methylphenidate"},{"label":"sleep","value":60,"group":"methylphenidate"},{"label":"BP","value":15,"group":"AF710B"},{"label":"sleep","value":20,"group":"AF710B"}],"notes":["Risk values are relative, not medical advice."]}
\`\`\`

\`\`\`neuropharm-graph
{"kind":"pk_timeline","title":"Methylphenidate exposure sketch","data":[{"label":"0 h","value":0,"unit":"relative"},{"label":"2 h","value":100,"unit":"relative"},{"label":"6 h","value":30,"unit":"relative"}],"notes":["Illustrative timing panel."]}
\`\`\``}
        cwd="/repo/project"
      />,
    );

    try {
      await expect.element(page.getByText("AF710B receptor selectivity")).toBeInTheDocument();
      await expect
        .element(page.getByLabelText("AF710B receptor selectivity radar chart"))
        .toBeInTheDocument();
      await expect.element(page.getByText("Stack risk matrix")).toBeInTheDocument();
      await expect.element(page.getByText("Matrix heatmap, normalized 0-100")).toBeInTheDocument();
      await expect.element(page.getByText("Methylphenidate exposure sketch")).toBeInTheDocument();
      await expect.element(page.getByText("Ordered exposure/effect timeline")).toBeInTheDocument();
      await expect
        .element(page.getByText(/"kind":"receptor_selectivity_radar"/))
        .not.toBeInTheDocument();
    } finally {
      await screen.unmount();
    }
  });

  it("auto-detects neuropharm graph JSON from plain json fences", async () => {
    const screen = await render(
      <ChatMarkdown
        text={`\`\`\`json
{"kind":"task_domain_matrix","title":"Cognition task matrix","data":[{"label":"attention","value":65,"group":"methylphenidate"},{"label":"working memory","value":35,"group":"methylphenidate"}],"notes":["Plain json fence should still render as a graph."]}
\`\`\``}
        cwd="/repo/project"
      />,
    );

    try {
      await expect.element(page.getByText("Cognition task matrix")).toBeInTheDocument();
      await expect.element(page.getByText("Matrix heatmap, normalized 0-100")).toBeInTheDocument();
      await expect
        .element(page.getByText("Plain json fence should still render as a graph."))
        .toBeInTheDocument();
      await expect.element(page.getByText(/"kind":"task_domain_matrix"/)).not.toBeInTheDocument();
    } finally {
      await screen.unmount();
    }
  });
});
