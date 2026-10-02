// AgentMail inbox panel: shows messages and lets you mark them read.
import { Net } from "../net";
import { h, $, openModal, closeAllModals, timeAgo } from "./dom";
import type { MailMessage } from "../../shared/protocol.js";

/** Open the inbox panel. */
export function openMailroom(net: Net) {
  const store = (window as any).__lite?.store;
  if (!store) return;

  const items = store.mailroom.messages.map((msg: MailMessage) =>
    h("li.mailroom-msg", { class: msg.read ? "read" : "unread", onclick: () => { if (!msg.read) net.send({ t: "mailroom.read", id: msg.id }); } },
      h("span.mailroom-from", {}, msg.from),
      h("span.mailroom-subject", {}, msg.subject || "(no subject)"),
      msg.preview ? h("span.mailroom-preview", {}, msg.preview) : null,
      h("span.mailroom-time", {}, timeAgo(new Date(msg.receivedAt).getTime())),
    )
  );

  const headerChildren: HTMLElement[] = [h("h2", {}, "\u{1F4EC} Inbox")];
  if (store.mailroom.messages.length) {
    headerChildren.push(h("span.unread", {}, `${store.mailUnread} unread`));
  }
  const bodyChildren: HTMLElement[] = store.mailroom.loading
    ? [h("p.mailroom-loading", {}, "Loading\u2026")]
    : store.mailroom.error
      ? [h("p.mailroom-error", {}, `\u26A0 ${store.mailroom.error}`)]
      : store.mailroom.messages.length === 0
        ? [h("p.mailroom-empty", {}, "No messages yet")]
        : [h("ul.mailroom-list", {}, ...items)];

  const panel = h("div.modal.mailroom-panel", {},
    h("header", {}, ...headerChildren),
    h("div.body", {}, ...bodyChildren),
  );
  openModal(panel);
}