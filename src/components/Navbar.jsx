import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-[18px]">
        <div className="flex items-center gap-2 font-display text-[19px] font-bold">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-forest font-mono text-[13px] font-semibold text-paper">&gt;_</span>
          PyQuest
        </div>
        <div className="hidden items-center gap-9 text-[15px] font-medium text-ink-soft md:flex">
          <a href="#inicio" className="transition-colors hover:text-ink">Início</a>
          <a href="#modulos" className="transition-colors hover:text-ink">Módulos</a>
          <a href="#sobre" className="transition-colors hover:text-ink">Sobre</a>
        </div>
        <div className="flex items-center gap-[18px]">
          <Link to="/login" className="hidden text-[15px] font-medium text-ink-soft transition-colors hover:text-ink sm:inline">Entrar</Link>
          <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-forest px-4 py-[9px] text-[13.5px] font-semibold text-paper shadow-sm transition-transform hover:-translate-y-px hover:bg-forest-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest">Começar grátis</Link>
        </div>
      </div>
    </nav>
  )
}
