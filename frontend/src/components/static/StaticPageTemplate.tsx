interface StaticPageSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  callout?: string;
}

interface StaticPageHighlight {
  label: string;
  value: string;
  detail: string;
}

type StaticPageVariant =
  | 'about'
  | 'contact'
  | 'faq'
  | 'guidelines'
  | 'privacy'
  | 'terms'
  | 'cookie'
  | 'security'
  | 'consent'
  | 'accessibility'
  | 'emergency';

type ContentBlockType = 'callout' | 'definition' | 'escalation' | 'commitment' | 'requirement';

interface ContentBlock {
  type: ContentBlockType;
  title?: string;
  content: string;
}

type LayoutVariant = 'default' | 'support-focused' | 'policy-focused' | 'info-focused';

interface StaticPageTemplateProps {
  title: string;
  description: string;
  lastUpdated: string;
  sections: StaticPageSection[];
  highlights: StaticPageHighlight[];
  eyebrow: string;
  variant: StaticPageVariant;
  layoutVariant?: LayoutVariant;
  contentBlocks?: ContentBlock[];
}

const variantStyles: Record<StaticPageVariant, { shell: string; badge: string; border: string; glow: string }> = {
  about: {
    shell: 'bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_32%),radial-gradient(circle_at_top_right,#ccfbf1,transparent_30%),linear-gradient(180deg,#f8fbff_0%,#ffffff_72%)]',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    border: 'border-sky-200/70',
    glow: 'from-sky-500/20 via-cyan-400/10 to-transparent',
  },
  contact: {
    shell: 'bg-[radial-gradient(circle_at_top_left,#ccfbf1,transparent_32%),radial-gradient(circle_at_bottom_right,#e0f2fe,transparent_28%),linear-gradient(180deg,#f8fafc_0%,#ffffff_72%)]',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    border: 'border-teal-200/70',
    glow: 'from-teal-500/20 via-cyan-400/10 to-transparent',
  },
  faq: {
    shell: 'bg-[radial-gradient(circle_at_top_right,#dbeafe,transparent_30%),radial-gradient(circle_at_bottom_left,#ccfbf1,transparent_28%),linear-gradient(180deg,#f8fafc_0%,#ffffff_72%)]',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    border: 'border-indigo-200/70',
    glow: 'from-indigo-500/20 via-sky-400/10 to-transparent',
  },
  guidelines: {
    shell: 'bg-[radial-gradient(circle_at_top_left,#fef3c7,transparent_30%),radial-gradient(circle_at_top_right,#ccfbf1,transparent_28%),linear-gradient(180deg,#fffdf7_0%,#ffffff_72%)]',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    border: 'border-amber-200/70',
    glow: 'from-amber-500/20 via-teal-400/10 to-transparent',
  },
  privacy: {
    shell: 'bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_30%),radial-gradient(circle_at_bottom_right,#f1f5f9,transparent_30%),linear-gradient(180deg,#f8fafc_0%,#ffffff_72%)]',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    border: 'border-slate-200/80',
    glow: 'from-slate-500/20 via-sky-400/10 to-transparent',
  },
  terms: {
    shell: 'bg-[radial-gradient(circle_at_top_right,#e2e8f0,transparent_30%),radial-gradient(circle_at_bottom_left,#ccfbf1,transparent_28%),linear-gradient(180deg,#f8fafc_0%,#ffffff_72%)]',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    border: 'border-slate-200/80',
    glow: 'from-slate-500/20 via-cyan-400/10 to-transparent',
  },
  cookie: {
    shell: 'bg-[radial-gradient(circle_at_top_left,#ffedd5,transparent_30%),radial-gradient(circle_at_bottom_right,#dbeafe,transparent_28%),linear-gradient(180deg,#fffaf4_0%,#ffffff_72%)]',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    border: 'border-orange-200/70',
    glow: 'from-orange-500/20 via-sky-400/10 to-transparent',
  },
  security: {
    shell: 'bg-[radial-gradient(circle_at_top_left,#dcfce7,transparent_30%),radial-gradient(circle_at_bottom_right,#dbeafe,transparent_28%),linear-gradient(180deg,#f8fff9_0%,#ffffff_72%)]',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    border: 'border-emerald-200/70',
    glow: 'from-emerald-500/20 via-sky-400/10 to-transparent',
  },
  consent: {
    shell: 'bg-[radial-gradient(circle_at_top_left,#ffe4e6,transparent_30%),radial-gradient(circle_at_top_right,#dbeafe,transparent_28%),linear-gradient(180deg,#fff8fa_0%,#ffffff_72%)]',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    border: 'border-rose-200/70',
    glow: 'from-rose-500/20 via-sky-400/10 to-transparent',
  },
  accessibility: {
    shell: 'bg-[radial-gradient(circle_at_top_left,#e2e8f0,transparent_30%),radial-gradient(circle_at_bottom_right,#dbeafe,transparent_28%),linear-gradient(180deg,#f8fafc_0%,#ffffff_72%)]',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    border: 'border-slate-200/70',
    glow: 'from-slate-500/20 via-sky-400/10 to-transparent',
  },
  emergency: {
    shell: 'bg-[radial-gradient(circle_at_top_left,#ffe4e6,transparent_30%),radial-gradient(circle_at_bottom_right,#fee2e2,transparent_28%),linear-gradient(180deg,#fff6f6_0%,#ffffff_72%)]',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    border: 'border-rose-200/80',
    glow: 'from-rose-500/20 via-orange-400/10 to-transparent',
  },
};

export default function StaticPageTemplate({
  title,
  description,
  lastUpdated,
  sections,
  highlights,
  eyebrow,
  variant,
  layoutVariant = 'default',
  contentBlocks,
}: StaticPageTemplateProps) {
  const styles = variantStyles[variant];

  const getBlockStyle = (type: ContentBlockType) => {
    switch (type) {
      case 'callout':
        return 'rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 p-4';
      case 'escalation':
        return 'rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 p-4';
      case 'definition':
        return 'rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 p-4';
      case 'commitment':
        return 'rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 p-4';
      case 'requirement':
        return 'rounded-2xl border border-blue-200 bg-blue-50 text-blue-900 p-4';
      default:
        return 'rounded-2xl border border-slate-200 bg-slate-50 p-4';
    }
  };

  return (
    <section className={`min-h-screen pt-28 pb-16 ${styles.shell}`}>
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-slate-900/5 to-transparent pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div>
          <div className="rounded-[2rem] border border-white/70 bg-white/90 backdrop-blur-xl shadow-[0_20px_80px_rgba(15,23,42,0.08)] p-6 sm:p-8 lg:p-10 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${styles.glow} opacity-70`} />
            <div className="relative">
              <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] ${styles.badge}`}>
                {eyebrow}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium">Clinexa</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium">Last updated {lastUpdated}</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium">Healthcare information</span>
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{description}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {highlights.map((highlight) => (
                  <div
                    key={highlight.label}
                    className={`rounded-2xl border ${styles.border} bg-white/90 p-4 shadow-sm`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{highlight.label}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{highlight.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{highlight.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6">
          {sections.map((section, index) => (
            <article
              key={section.heading}
              className={`rounded-[1.75rem] border ${styles.border} bg-white/92 backdrop-blur-sm shadow-[0_12px_40px_rgba(15,23,42,0.05)] p-6 sm:p-8`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${styles.badge}`}>
                    Section {index + 1}
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{section.heading}</h2>
                </div>
                <div className="h-1.5 w-20 rounded-full bg-gradient-to-r from-cyan-500 to-teal-400" />
              </div>

              <div className="mt-5 space-y-4">
                {section.paragraphs.map((text) => (
                  <p key={text} className="max-w-4xl text-base leading-8 text-slate-600">
                    {text}
                  </p>
                ))}
              </div>

              {section.callout && (
                <div className={`mt-6 rounded-2xl border ${styles.border} bg-slate-50 p-4 text-sm leading-7 text-slate-700`}>
                  {section.callout}
                </div>
              )}

              {section.bullets && section.bullets.length > 0 && (
                <ul className="mt-6 grid gap-3 md:grid-cols-2">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/90 p-4 text-sm leading-7 text-slate-700">
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-teal-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>

        {contentBlocks && contentBlocks.length > 0 && (
          <div className="mt-10 grid gap-6">
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Additional Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {contentBlocks.map((block, idx) => (
                <div key={idx} className={`text-sm leading-7 ${getBlockStyle(block.type)}`}>
                  {block.title && <p className="font-semibold mb-2">{block.title}</p>}
                  <p>{block.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}