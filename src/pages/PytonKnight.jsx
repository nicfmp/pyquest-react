import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../lib/api'
import { getToken } from '../lib/auth'

const GAME_SRC = '/game/pyton-knight/index.html'

export default function PytonKnight() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  async function returnToDashboard() {
    setSaving(true)
    setSaveError('')
    try {
      const persistence = gameFrame.current?.contentWindow?.PersistenceService
      if (persistence && !(await persistence.flush())) throw new Error('save')
      navigate('/dashboard')
    } catch {
      setSaveError('Não foi possível salvar. Verifique a conexão e tente voltar novamente.')
    } finally { setSaving(false) }
  }
  const [loaded, setLoaded] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const gameFrame = useRef(null)

  const connectGame = useCallback(() => {
    const frame = gameFrame.current?.contentWindow
    if (frame) frame.postMessage({ type: 'pyquest:auth', apiBase: `${API_URL.replace(/\/$/, '')}/api`, token: getToken() }, window.location.origin)
  }, [])

  useEffect(() => {
    function onMessage(event) {
      if (event.origin === window.location.origin && event.source === gameFrame.current?.contentWindow && event.data?.type === 'pyquest:ready') connectGame()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [connectGame])

  return (
    <div className={`flex min-h-screen flex-col bg-ink ${fullscreen ? 'fixed inset-0 z-[100]' : ''}`}>
      {!fullscreen && (
        <nav className="sticky top-0 z-50 border-b border-[#2A332B] bg-ink/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <button type="button" disabled={saving} onClick={returnToDashboard} className="flex items-center gap-2 text-[14px] font-medium text-[#D9E3DB] hover:text-white">
              {saving ? 'Salvando progresso…' : '← Voltar ao painel'}
            </button>
            <span className="font-mono text-[12.5px] text-[#8B9A8E]">Pyton Knight · Dungeon educacional</span>
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="rounded-full border border-[#3A453C] px-4 py-[7px] text-[12.5px] font-semibold text-[#D9E3DB] transition-colors hover:border-forest hover:bg-[#1E251F]"
            >
              Tela cheia
            </button>
          </div>
        </nav>
      )}

      {saveError && <p role="alert" className="bg-red-900 px-6 py-3 text-white">{saveError}</p>}
      <main className="relative flex flex-1 items-center justify-center">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#3A453C] border-t-forest" />
            <p className="font-mono text-[13px] text-[#8B9A8E]">Carregando o jogo…</p>
          </div>
        )}

        {fullscreen && (
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="absolute right-4 top-4 z-10 rounded-full border border-[#3A453C] bg-ink/80 px-4 py-[7px] font-mono text-[12.5px] text-[#D9E3DB] backdrop-blur-sm hover:border-forest"
          >
            Sair da tela cheia
          </button>
        )}

        <iframe
          ref={gameFrame}
          title="Pyton Knight"
          src={GAME_SRC}
          onLoad={() => { setLoaded(true); connectGame() }}
          className={`w-full border-0 ${fullscreen ? 'h-screen' : 'h-[calc(100vh-65px)]'}`}
          allow="fullscreen; gamepad"
        />
      </main>
    </div>
  )
}
