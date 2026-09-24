import { Link } from 'react-router-dom'
import knightHero from '../assets/knight-hero.png'

export default function Hero() {
  return (
    <section id="inicio" className="pb-[60px] pt-[76px]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <span className="mb-[22px] inline-flex items-center gap-2 rounded-full bg-sage py-[6px] pl-[10px] pr-[14px] font-mono text-[12.5px] font-medium tracking-wide text-forest-deep">
            <span className="h-[7px] w-[7px] rounded-full bg-forest" />
            GAMIFICAÇÃO + PYTHON + IA
          </span>

          <h1 className="mb-[22px] font-display text-[32px] font-bold leading-[1.08] text-ink sm:text-[40px] lg:text-[52px]">
            Aprenda Python.
            <br />
            Do zero.
            <br />
            <span className="text-forest">De verdade.</span>
          </h1>

          <p className="mb-8 max-w-[460px] text-[17px] leading-[1.6] text-ink-soft">
            Uma plataforma interativa com desafios progressivos, sistema de XP,
            conquistas e um tutor de IA que explica seus erros em português.
          </p>

          <div className="mb-[34px] flex flex-wrap gap-[14px]">
            <Link
              to="/register"
              className="inline-flex items-center justify-center rounded-full bg-forest px-[22px] py-3 text-[14.5px] font-semibold text-paper transition-transform hover:-translate-y-px hover:bg-forest-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              Iniciar jornada gratuita
            </Link>
            <a
              href="#modulos"
              className="inline-flex items-center justify-center rounded-full border border-line px-[22px] py-3 text-[14.5px] font-semibold text-ink transition-transform hover:-translate-y-px hover:border-ink-soft hover:bg-paper-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              Explorar módulos
            </a>
          </div>

          <div className="flex gap-7 text-[13.5px] text-ink-soft">
            <div>
              <strong className="block font-display text-[20px] font-bold text-ink">4</strong>
              módulos
            </div>
            <div>
              <strong className="block font-display text-[20px] font-bold text-ink">40</strong>
              desafios
            </div>
            <div>
              <strong className="block font-display text-[20px] font-bold text-ink">24/7</strong>
              tutor de IA
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <img
            src={knightHero}
            alt="Cavaleiro pixel art do PyQuest com um redemoinho de energia mágica"
            className="w-full max-w-[760px] drop-shadow-[0_30px_40px_rgba(30,74,54,0.25)] lg:max-w-[840px]"
          />
        </div>
      </div>
    </section>
  )
}
