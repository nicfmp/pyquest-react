import { quests } from '../data/quests'

function ModuleCard({ quest, title, description, level, totalChallenges }) {
  return (
    <div className="group rounded-[14px] border border-line bg-paper-soft p-6 pb-[26px] transition-all duration-200 hover:-translate-y-1 hover:border-forest hover:shadow-[0_14px_28px_-18px_rgba(30,74,54,0.35)]">
      <span className="mb-[14px] block font-mono text-xs font-semibold text-forest">{quest}</span>
      <h3 className="mb-2 font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mb-4 text-[13.5px] leading-[1.55] text-ink-soft">{description}</p>
      <div className="flex flex-wrap gap-[6px]">
        <span className="rounded-md bg-sage px-2 py-[3px] font-mono text-[11px] text-forest-deep">{level}</span>
        <span className="rounded-md bg-sage px-2 py-[3px] font-mono text-[11px] text-forest-deep">{totalChallenges} desafios</span>
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
            <h2 className="font-display text-[34px] font-bold text-ink">4 módulos</h2>
            <p className="mt-2 max-w-[420px] text-[15px] text-ink-soft">
              Cada módulo é uma quest completa: você avança desbloqueando desafios até dominar o assunto.
            </p>
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
