import { useState } from 'react'
import { Link } from 'react-router-dom'

const GAME_SRC = '/game/pyton-knight/index.html'

export default function PytonKnight() {
  const [loaded, setLoaded] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <div className={`flex min-h-screen flex-col bg-ink ${fullscreen ? 'fixed inset-0 z-[100]' : ''}`}>
      {!fullscreen && (
        <nav className="sticky top-0 z-50 border-b border-[#2A332B] bg-ink/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-[14px] font-medium text-[#D9E3DB] hover:text-white">
              ← Voltar ao painel
            </Link>
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
          title="Pyton Knight"
          src={GAME_SRC}
          onLoad={() => setLoaded(true)}
          className={`w-full border-0 ${fullscreen ? 'h-screen' : 'h-[calc(100vh-65px)]'}`}
          allow="fullscreen; gamepad"
        />
      </main>
    </div>
  )
}
