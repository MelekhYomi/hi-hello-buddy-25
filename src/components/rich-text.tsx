import { createElement, type ReactNode } from "react";

// Renders article text that may contain simple HTML (p, h2, ul, strong, links...) or plain
// text. Instead of injecting raw HTML, it builds React elements from a small allow-list, so
// anything else (scripts, event handlers, unknown tags) is dropped. Safe to render on the
// server and in the browser.

const STYLES: Record<string, string> = {
  p: "mt-5",
  h2: "mt-12 font-display text-3xl leading-tight",
  h3: "mt-8 font-display text-2xl leading-tight",
  h4: "mt-6 font-display text-xl",
  ul: "mt-5 list-disc space-y-2 pl-6",
  ol: "mt-5 list-decimal space-y-2 pl-6",
  li: "pl-1",
  blockquote: "mt-6 border-l-2 border-imperium pl-5 italic",
  strong: "font-semibold text-foreground",
  b: "font-semibold text-foreground",
  em: "italic",
  i: "italic",
  a: "text-imperium underline underline-offset-4 hover:opacity-80",
  img: "mt-8 w-full rounded-md",
};
const ALLOWED = new Set([...Object.keys(STYLES), "br", "hr"]);
const VOID = new Set(["br", "hr", "img"]);
const DROP_WITH_CONTENT = new Set(["script", "style", "iframe", "object", "embed", "noscript"]);

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s: string) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });

const safeUrl = (u: string | undefined) => {
  const v = (u ?? "").trim();
  return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(v) ? v : undefined;
};

function attr(raw: string, name: string): string | undefined {
  const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(raw);
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? "") : undefined;
}

type Node = { tag: string; props: Record<string, string | undefined>; children: ReactNode[] };

function parse(html: string): ReactNode[] {
  const root: Node = { tag: "root", props: {}, children: [] };
  const stack: Node[] = [root];
  const top = () => stack[stack.length - 1];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*)>|([^<]+)|(<)/g;
  let skipUntil: string | null = null;
  let key = 0;

  const close = (n: Node): ReactNode => {
    const props: Record<string, unknown> = { key: key++, className: STYLES[n.tag] };
    if (n.tag === "a") {
      props.href = safeUrl(n.props.href);
      if (/^https?:/i.test(props.href as string ?? "")) {
        props.target = "_blank";
        props.rel = "noopener noreferrer";
      }
    }
    if (n.tag === "img") {
      props.src = safeUrl(n.props.src);
      props.alt = n.props.alt ?? "";
      props.loading = "lazy";
      if (!props.src) return null;
    }
    return VOID.has(n.tag) ? createElement(n.tag, props) : createElement(n.tag, props, ...n.children);
  };

  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const [, slash, rawTag, rawAttrs, text, lone] = m;
    if (skipUntil) {
      if (slash && rawTag?.toLowerCase() === skipUntil) skipUntil = null;
      continue;
    }
    if (text !== undefined) {
      top().children.push(decode(text));
    } else if (lone) {
      top().children.push("<");
    } else {
      const tag = rawTag.toLowerCase();
      if (DROP_WITH_CONTENT.has(tag)) {
        if (!slash) skipUntil = tag;
        continue;
      }
      if (!ALLOWED.has(tag)) continue; // unknown tag: drop the tag, keep its text
      if (slash) {
        const at = stack.map((n) => n.tag).lastIndexOf(tag);
        if (at > 0) {
          while (stack.length - 1 >= at) {
            const done = stack.pop() as Node;
            top().children.push(close(done));
          }
        }
      } else {
        const node: Node = {
          tag,
          props: { href: attr(rawAttrs, "href"), src: attr(rawAttrs, "src"), alt: attr(rawAttrs, "alt") },
          children: [],
        };
        if (VOID.has(tag) || /\/\s*$/.test(rawAttrs)) top().children.push(close(node));
        else stack.push(node);
      }
    }
  }
  while (stack.length > 1) {
    const done = stack.pop() as Node;
    top().children.push(close(done));
  }
  return root.children;
}

export function RichText({ body, className }: { body: string | null | undefined; className?: string }) {
  const text = body ?? "";
  if (!/<\/?[a-zA-Z][^>]*>/.test(text)) {
    // Plain text: blank lines separate paragraphs, single line breaks are kept.
    return (
      <div className={className}>
        {text
          .split(/\n{2,}/)
          .filter((p) => p.trim())
          .map((p, i) => (
            <p key={i} className="mt-5 whitespace-pre-line first:mt-0">
              {p.trim()}
            </p>
          ))}
      </div>
    );
  }
  return <div className={className}>{parse(text)}</div>;
}
