import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../lib/api'
import { getToken } from '../lib/auth'
import { useProgress } from '../context/ProgressContext'

// Progresso do jogo Pyton Knight, salvo pelo backend (rota /api/game-progress).
// Se a chamada falhar (backend fora do ar, primeiro acesso) cai para os
// valores padrão sem quebrar a tela.
function useGameProgress() {
  const [state, setState] = useState(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return

    let cancelled = false
    fetch(`${API_URL}/api/game-progress`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!cancelled && body) setState(body.state)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  return state
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, status, logout } = useProgress()
  const gameProgress = useGameProgress()

  const loading = status === 'idle' || status === 'loading'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const totalXp = gameProgress?.totalXp ?? 0
  const walletCoins = gameProgress?.walletCoins ?? 0
  const completedActivities = gameProgress?.completedActivities?.length ?? 0
  const unlockedMax = gameProgress?.unlockedMax ?? 1

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
            Entre na masmorra do Livro Mágico e programe Guto em Python. Seu progresso fica salvo na sua conta.
          </p>
        </div>

        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-[14px] border border-line bg-paper-soft p-5">
            <span className="block font-display text-[26px] font-bold text-ink">{totalXp}</span>
            <span className="text-[12.5px] text-ink-soft">XP no jogo</span>
          </div>
          <div className="rounded-[14px] border border-line bg-paper-soft p-5">
            <span className="block font-display text-[26px] font-bold text-ink">{walletCoins}</span>
            <span className="text-[12.5px] text-ink-soft">moedas</span>
          </div>
          <div className="rounded-[14px] border border-line bg-paper-soft p-5">
            <span className="block font-display text-[26px] font-bold text-ink">{completedActivities}/20</span>
            <span className="text-[12.5px] text-ink-soft">atividades concluídas</span>
          </div>
          <div className="rounded-[14px] border border-line bg-paper-soft p-5">
            <span className="block font-display text-[26px] font-bold text-ink">{unlockedMax}/20</span>
            <span className="text-[12.5px] text-ink-soft">fase desbloqueada</span>
          </div>
        </div>

        <Link
          to="/jogo"
          className="group flex flex-col items-start justify-between gap-4 rounded-[14px] border border-[#2A332B] bg-ink p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_28px_-18px_rgba(22,29,24,0.55)] sm:flex-row sm:items-center"
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
            {completedActivities > 0 ? 'Continuar jogando' : 'Jogar agora'}
          </span>
        </Link>
      </main>
    </div>
  )
}
