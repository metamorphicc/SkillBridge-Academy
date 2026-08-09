# Design - SkillBridge Academy

Locked design system. Future Hallmark runs read this file first; pages defer
to it. Amend intentionally: this is the rule.

## System
- Genre · playful business-human product page
- Macrostructure · Narrative Workflow
- Theme · studied-DNA from Hum-07, diverged for B2B admissions automation
- Axes · pale institutional paper / rounded sans / admissions-blue primary / functional status accents

## Provenance
Extracted from `https://www.usehallmark.com/examples/hum-07/` on 2026-08-10 as
a public reference for the user's own project. The DNA is structural: workflow
spine, rounded type, tactile process components, pale paper, small functional
accents. Do not copy Bubble's sourdough content, jar character, exact artwork,
pricing, testimonials, or brand language. Tokens and fonts were extracted from
source CSS; rhythm was inferred from HTML/CSS, not a screenshot.

2026-08-10 divergence: SkillBridge must not look like a recolored Hum page.
Its signature motif is an admissions routing board: applicants move across
priority lanes, manager briefs, and follow-up tasks. Main color is admissions
blue, not mint.

## Tokens
`tokens.css` is the source of truth.

```css
:root {
  --color-paper: oklch(97% 0.014 78);
  --color-paper-2: oklch(94% 0.018 78);
  --color-paper-3: oklch(91% 0.022 78);
  --color-rule: oklch(86% 0.014 90);
  --color-ink: oklch(20% 0.012 250);
  --color-ink-2: oklch(28% 0.014 250);
  --color-muted: oklch(52% 0.014 90);
  --color-accent: oklch(64% 0.17 220);
  --color-accent-ink: oklch(98% 0.012 78);
  --color-focus: oklch(58% 0.2 220);

  --font-display: "Plus Jakarta Sans", "Geist", "Inter", sans-serif;
  --font-body: "Plus Jakarta Sans", "Geist", "Inter", sans-serif;
  --font-label: "JetBrains Mono", "Geist Mono", monospace;
}
```

## Page Pattern
- Marketing pages use one operational process as the page spine.
- For SkillBridge, the spine is: Lead -> Chat -> Score -> Alert -> Next action -> Follow-up.
- Each major section shows one real product moment: chat, lead profile, priority score, Telegram alert, CRM row, reminder.
- Process color is functional: admissions blue for routing, teal for chat, amber for warm/next step, coral for urgent/hot, blue-gray for nurture.
- The hero should include a queue/routing-board moment. Avoid cute character-object composition.
- Product scenes are built from interface objects, not generic AI art.

## CTA Voice
- Primary · admissions-blue filled pill, tactile shadow, action-specific copy.
- Secondary · cream outline pill, same radius, no gradient.
- CTAs are short and single-line at mobile widths.

## Motion Stance
- CSS/vanilla JS only.
- Allowed: nav float, stage reveal, score update, small interface pulse.
- Avoid: decorative confetti, generic particles, infinite floating objects.
- Reduced motion: no spatial motion; opacity/instant state only.

## Notes
- Do not invent metrics, testimonials, customers, or proof logos.
- Do not carry over the sourdough metaphor or the jar illustration.
- Do not copy the exact Hum-07 layout; reuse the workflow spine and component logic.
- Do not use mint as the main color; it makes the page read too close to Hum-07.
- Keep the page B2B-clear: friendly, practical, visual, not childish.

## Exports
`tokens.css` is the portable export for this project. Ask for Tailwind, DTCG, or
shadcn exports if another format is needed.
