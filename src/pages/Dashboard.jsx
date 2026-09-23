import { Link, useNavigate } from 'react-router-dom'
import { quests } from '../data/quests'
import { buildQuestProgress } from '../data/progress'
import { useProgress } from '../context/ProgressContext'

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function QuestCard({ id, quest, title, description, level, totalChallenges, completedChallenges, isComplete, locked }) {
  const pct = Math.round((completedChallenges / totalChallenges) * 100)

  let statusLabel = 'Não iniciada'
  let statusClasses = 'bg-line/60 text-ink-soft'
  if (locked) {
    statusLabel = 'Bloqueada'
    statusClasses = 'bg-line/60 text-ink-soft'
  } else if (isComplete) {
    statusLabel = 'Concluída'
    statusClasses = 'bg-sage text-forest-deep'
  } else if (completedChallenges > 0) {
    statusLabel = 'Em andamento'
    statusClasses = 'bg-amber/20 text-amber'
  }

  return (
    <div
      className={`relative rounded-[14px] border p-6 pb-[26px] transition-all duration-200 ${
        locked
          ? 'border-line bg-paper-soft/60 opacity-70'
          : 'border-line bg-paper-soft hover:-translate-y-1 hover:border-forest hover:shadow-[0_14px_28px_-18px_rgba(30,74,54,0.35)]'
      }`}
    >
      <div className="mb-[14px] flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-forest">{quest}</span>
        <span className={`flex items-center gap-1 rounded-md px-2 py-[3px] font-mono text-[10.5px] ${statusClasses}`}>
          {locked && <LockIcon />}
          {statusLabel}
        </span>
      </div>

      <h3 className="mb-2 font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mb-4 text-[13.5px] leading-[1.55] text-ink-soft">{description}</p>

      <div className="mb-4 flex flex-wrap gap-[6px]">
        <span className="rounded-md bg-sage px-2 py-[3px] font-mono text-[11px] text-forest-deep">{level}</span>
      </div>

      <div className="mb-1 flex justify-between text-[11.5px] text-ink-soft">
        <span>{completedChallenges} / {totalChallenges} desafios</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-gradient-to-r from-forest to-amber transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      {!locked && (
        <Link
          to={`/quest/${id}`}
          className="mt-5 block w-full rounded-full border border-line py-2 text-center text-[13px] font-semibold text-ink transition-colors hover:border-forest hover:bg-paper"
        >
          {isComplete ? 'Revisar quest' : completedChallenges > 0 ? 'Continuar' : 'Começar quest'}
        </Link>
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, progress, status, logout } = useProgress()

  const loading = status === 'idle' || status === 'loading'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const questProgress = buildQuestProgress(quests, progress)
  const totalChallenges = quests.reduce((sum, q) => sum + q.totalChallenges, 0)
  const completedChallenges = questProgress.reduce((sum, q) => sum + q.completedChallenges, 0)
  const completedQuests = questProgress.filter((q) => q.isComplete).length
  const totalXp = questProgress.reduce((sum, q) => sum + q.xp, 0)

  return (
    <div className="min-h-screen bg-paper">
      <nav className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-[18px]">
          <Link to="/dashboard" className="flex items-center gap-2 font-display text-[19px] font-bold text-ink">
            <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-forest font-mono text-[13px] font-semibold text-paper">&gt;_</span>
            PyQuest
          </Link>

          <div className="flex items-center gap-4">
            {!loading && (
              <span className="hidden text-[13.5px] text-ink-soft sm:inline">{user?.username ?? user?.email ?? 'sua conta'}</span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-line px-4 py-[9px] text-[13.5px] font-semibold text-ink transition-colors hover:border-forest hover:bg-paper-soft"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-8 py-12">
        <div className="mb-10">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sage py-[6px] pl-[10px] pr-[14px] font-mono text-[12.5px] font-medium tracking-wide text-forest-deep">
            <span className="h-[7px] w-[7px] rounded-full bg-forest" />
            SUA JORNADA
          </span>
          <h1 className="mb-2 font-display text-[32px] font-bold text-ink">
            {loading ? 'Carregando...' : 'Sua jornada está só começando'}
          </h1>
          <p className="max-w-[520px] text-[15px] text-ink-soft">
            Complete a Quest 01 para desbloquear a próxima. Cada desafio resolvido soma XP e fica salvo na sua conta.
          </p>
        </div>

        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-[14px] border border-line bg-paper-soft p-5">
            <span className="block font-display text-[26px] font-bold text-ink">{totalXp}</span>
            <span className="text-[12.5px] text-ink-soft">XP total</span>
          </div>
          <div className="rounded-[14px] border border-line bg-paper-soft p-5">
            <span className="block font-display text-[26px] font-bold text-ink">{completedQuests}/{quests.length}</span>
            <span className="text-[12.5px] text-ink-soft">quests concluídas</span>
          </div>
          <div className="rounded-[14px] border border-line bg-paper-soft p-5">
            <span className="block font-display text-[26px] font-bold text-ink">{completedChallenges}/{totalChallenges}</span>
            <span className="text-[12.5px] text-ink-soft">desafios concluídos</span>
          </div>
          <div className="rounded-[14px] border border-line bg-paper-soft p-5">
            <span className="block font-display text-[26px] font-bold text-ink">0</span>
            <span className="text-[12.5px] text-ink-soft">dias seguidos</span>
          </div>
        </div>

        <Link
          to="/jogo"
          className="group mb-12 flex flex-col items-start justify-between gap-4 rounded-[14px] border border-[#2A332B] bg-ink p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_28px_-18px_rgba(22,29,24,0.55)] sm:flex-row sm:items-center"
        >
          <div>
            <span className="mb-2 inline-block rounded-md bg-forest/20 px-2 py-[3px] font-mono text-[11px] text-amber">
              JOGO
            </span>
            <h3 className="font-display text-lg font-semibold text-white">Pyton Knight</h3>
            <p className="mt-1 max-w-md text-[13.5px] leading-[1.55] text-[#8B9A8E]">
              Explore a masmorra do Livro Mágico e programe Guto em Python para resolver as 20 atividades.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-forest px-5 py-2.5 text-[13px] font-semibold text-paper transition-colors group-hover:bg-forest-deep">
            Jogar agora
          </span>
        </Link>

       
      </main>
    </div>
  )
}
