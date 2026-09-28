import { quests } from '../data/quests'

const ICONS = {
  book: (
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3z" />
  ),
  brain: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M15 2v2M9 2v2M15 20v2M9 20v2M20 15h2M20 9h2M2 15h2M2 9h2" />
    </>
  ),
  layers: (
    <>
      <path d="m12.83 2.18-8.58 3.9a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83l-8.58-3.9a2 2 0 0 0-1.66 0Z" />
      <path d="m2 12.65 8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9" />
      <path d="m2 17.65 8.58 3.9a2 2 0 0 0 1.66 0l8.58-3.9" />
    </>
  ),
  repeat: (
    <path d="m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3" />
  ),
}

function ModuleIcon({ name }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}

function ModuleCard({ moduleLabel, title, icon, bullets, level, totalChallenges }) {
  return (
    <div className="flex flex-col rounded-[16px] bg-ink p-6 pb-5 text-paper transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_34px_-18px_rgba(0,0,0,0.55)]">
      <div className="mb-4 flex items-start justify-between">
        <span className="font-mono text-[11px] font-semibold tracking-wide text-sage/70">{moduleLabel}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-forest text-paper">
          <ModuleIcon name={icon} />
        </span>
      </div>

      <h3 className="mb-2 font-display text-lg font-semibold text-paper">{title}</h3>

      <ul className="mb-5 flex-1 space-y-[6px] text-[13px] leading-[1.5] text-[#9FB3A6]">
        {bullets.map((b) => (
          <li key={b} className="flex gap-[7px]">
            <span className="mt-[2px] text-forest">•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-[6px]">
        <span className="rounded-md bg-sage px-2 py-[3px] font-mono text-[11px] font-medium capitalize text-forest-deep">
          {level}
        </span>
        <span className="rounded-md border border-white/15 px-2 py-[3px] font-mono text-[11px] text-[#9FB3A6]">
          {totalChallenges} desafios
        </span>
      </div>
    </div>
  )
}

export default function Modules() {
  return (
    <section id="modulos" className="py-[70px] pb-[90px]">
      <div className="mx-auto max-w-6xl px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="font-display text-[34px] font-bold text-ink">Roadmap de 4 módulos</h2>
            <p className="mt-2 max-w-[420px] text-[15px] text-ink-soft">
              Cada módulo é uma quest completa: você avança desbloqueando desafios até dominar o assunto.
            </p>
          </div>
        </div>

        <div className="relative mb-7 hidden lg:block">
          <div className="absolute left-[12.5%] right-[12.5%] top-1/2 h-[2px] -translate-y-1/2 bg-line" />
          <div className="relative grid grid-cols-4">
            {quests.map((q) => (
              <div key={q.id} className="flex justify-center">
                <span className="h-3 w-3 rounded-full border-2 border-forest bg-paper" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {quests.map((q) => (
            <ModuleCard key={q.id} {...q} />
          ))}
        </div>
      </div>
    </section>
  )
}
