/**
 * Entry point for @csp_officials post rendering. Each format has its own
 * file in lib/render/csp/; shared helpers live in lib/render/csp/common.ts.
 */

import type { CspTemplateContent } from "@/lib/automation/csp-content";

import { renderChat } from "./csp/chat";
import { renderDictionary } from "./csp/dictionary";
import { renderNotifications } from "./csp/notifications";
import { renderPoster } from "./csp/poster";
import { renderVersus } from "./csp/versus";

export { CSP_HEIGHT, CSP_WIDTH } from "./csp/common";

export async function renderCspPost(content: CspTemplateContent): Promise<Buffer> {
  switch (content.format) {
    case "dictionary":
      return renderDictionary(content);
    case "chat":
      return renderChat(content);
    case "notifications":
      return renderNotifications(content);
    case "poster":
      return renderPoster(content);
    case "versus":
      return renderVersus(content);
  }
}
