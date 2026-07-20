import { contentValue } from "./content-defaults";
import type { ContentRow } from "@/lib/backend";

// Sourced from Content blocks (faq_q1/faq_a1 ... ), editable from
// /admin/content's existing draft/publish CMS — not a bespoke FAQ table.
// Answers stay hidden until the question is hovered (or focused, for
// keyboard/touch users) — .faq-item/.faq-answer in globals.css.
const FAQ_KEYS = [1, 2, 3, 4] as const;

// Splits a question into per-letter spans so .letter-pop (globals.css) can
// stagger a little "pop" per character on hover, instead of one flat move.
function PoppingText({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="letter-pop inline-block"
          style={{ animationDelay: `${i * 18}ms` }}
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </>
  );
}

export function Faq({ contentRows }: { contentRows: ContentRow[] }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-eyebrow">Real questions</p>
      <h2 className="text-display-lg mt-2 text-foreground">Things people actually ask us</h2>
      <p className="mt-2 text-sm text-muted-foreground">Hover a question to see the answer.</p>
      <dl className="mt-8 divide-y divide-border border-t border-border">
        {FAQ_KEYS.map((n) => (
          <div key={n} tabIndex={0} className="faq-item cursor-default py-6 outline-none">
            <dt className="text-lg font-semibold text-foreground">
              <PoppingText text={contentValue(contentRows, `faq_q${n}`)} />
            </dt>
            <dd className="faq-answer">
              <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {contentValue(contentRows, `faq_a${n}`)}
              </div>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
