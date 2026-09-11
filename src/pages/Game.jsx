import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { quests } from '../data/quests'
import { challengesByQuest } from '../data/challenges'
import { buildQuestProgress } from '../data/progress'
import { useProgress } from '../context/ProgressContext'
import { usePyodide } from '../lib/usePyodide'

export default function Game() {
  const { questId } = useParams()
  const navigate = useNavigate()
  const { progress, completeNextChallenge } = useProgress()
  const { status: pyodideStatus, runPython } = usePyodide()

  const id = Number(questId)
  const quest = quests.find((q) => q.id === id)
  const questProgress = useMemo(() => buildQuestProgress(quests, progress), [progress])
  const thisQuest = questProgress.find((q) => q.id === id)
  const challenges = challengesByQuest[id] || []

  const [index, setIndex] = useState(thisQuest?.completedChallenges ?? 0)
  const [code, setCode] = useState('')
  const [output, setOutput] = useState('')
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)

  const challenge = challenges[index]

  useEffect(() => {
    if (challenge) setCode(challenge.starterCode)
    setOutput('')
    setResult(null)
  }, [challenge])

  if (!quest) return <Navigate to="/dashboard" replace />
  if (thisQuest.locked) return <Navigate to="/dashboard" replace />
  if (challenges.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">{quest.title} chega em breve</h1>
        <p className="max-w-sm text-ink-soft">
          Os desafios dessa quest ainda estão sendo preparados. Volte depois de terminar as anteriores!
        </p>
        <Link to="/dashboard" className="rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-paper hover:bg-forest-deep">
          Voltar ao painel
        </Link>
      </div>
    )
  }

  const questComplete = index >= challenges.length

  async function handleRun() {
    if (pyodideStatus !== 'ready' || running) return
    setRunning(true)
    setResult(null)

    const { output: out, error } = await runPython(code)
    setOutput(error ? error : out)

    if (error) {
      setResult('error')
    } else if (out.trim() === challenge.expectedOutput.trim()) {
      setResult('success')
      await completeNextChallenge(id)
    } else {
      setResult('wrong')
    }
    setRunning(false)
  }

  function handleNext() {
    setIndex((i) => i + 1)
  }

  return (
    <div className="min-h-screen bg-paper">
      <nav className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-[14px] font-medium text-ink-soft hover:text-ink">← Voltar ao painel</Link>
          <span className="font-mono text-[12.5px] text-ink-soft">{quest.quest} · {quest.title}</span>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {questComplete ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-paper-soft py-16 text-center">
            <span className="rounded-full bg-sage px-4 py-1 font-mono text-xs text-forest-deep">QUEST CONCLUÍDA</span>
            <h1 className="font-display text-3xl font-bold text-ink">Mandou bem! 🎉</h1>
            <p className="max-w-sm text-ink-soft">
              Você completou todos os desafios de {quest.title}. A próxima quest já foi desbloqueada.
            </p>
            <button onClick={() => navigate('/dashboard')} className="mt-2 rounded-full bg-forest px-6 py-2.5 text-sm font-semibold text-paper hover:bg-forest-deep">
              Ver meu progresso
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="mb-2 flex justify-between text-[12.5px] text-ink-soft">
                <span>Desafio {index + 1} de {challenges.length}</span>
                <span>{thisQuest.completedChallenges} concluídos</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-gradient-to-r from-forest to-amber transition-all duration-500" style={{ width: `${(index / challenges.length) * 100}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <span className="mb-2 block font-mono text-xs font-semibold text-forest">DESAFIO {index + 1}</span>
                <h1 className="mb-3 font-display text-2xl font-bold text-ink">{challenge.title}</h1>
                <p className="text-[15px] leading-relaxed text-ink-soft">{challenge.prompt}</p>

                {result === 'success' && (
                  <div className="mt-6 rounded-xl border border-forest/30 bg-sage/60 p-4 text-[14px] text-forest-deep">
                    ✓ Certinho! +100 XP
                    <button onClick={handleNext} className="mt-3 block w-full rounded-full bg-forest py-2.5 text-sm font-semibold text-paper hover:bg-forest-deep">
                      Próximo desafio
                    </button>
                  </div>
                )}
                {result === 'wrong' && (
                  <div className="mt-6 rounded-xl border border-amber/40 bg-amber/10 p-4 text-[14px] text-ink">
                    Quase lá — a saída não bateu com o esperado. Confira seu código e rode de novo.
                  </div>
                )}
                {result === 'error' && (
                  <div className="mt-6 rounded-xl border border-red-300 bg-red-50 p-4 text-[13px] font-mono text-red-600">{output}</div>
                )}
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#232B25] bg-ink shadow-[0_20px_50px_-18px_rgba(22,29,24,0.45)]">
                <div className="flex items-center gap-2 border-b border-[#2A332B] bg-[#1E251F] px-4 py-3">
                  <span className="h-[10px] w-[10px] rounded-full bg-amber" />
                  <span className="h-[10px] w-[10px] rounded-full bg-[#7FB89A]" />
                  <span className="h-[10px] w-[10px] rounded-full bg-[#5A6B5D]" />
                  <span className="ml-2 font-mono text-xs text-[#8B9A8E]">quest_{String(id).padStart(2, '0')}_desafio_{index + 1}.py</span>
                </div>

                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  className="h-52 w-full resize-none bg-ink px-[22px] py-[18px] font-mono text-[13.5px] leading-[1.7] text-[#D9E3DB] outline-none"
                />

                <div className="border-t border-[#2A332B] px-[22px] py-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[#8B9A8E]">saída</span>
                    <button
                      onClick={handleRun}
                      disabled={pyodideStatus !== 'ready' || running}
                      className="rounded-full bg-forest px-4 py-[7px] text-[12.5px] font-semibold text-paper transition-colors hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pyodideStatus !== 'ready' ? 'Carregando Python...' : running ? 'Rodando...' : 'Rodar código'}
                    </button>
                  </div>
                  <pre className="min-h-[40px] whitespace-pre-wrap font-mono text-[13px] text-[#D9E3DB]">{output || ' '}</pre>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
