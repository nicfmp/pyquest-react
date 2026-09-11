import { Link } from 'react-router-dom'

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

        <div className="overflow-hidden rounded-2xl border border-[#232B25] bg-ink shadow-[0_20px_50px_-18px_rgba(22,29,24,0.45)]">
          <div className="flex items-center gap-2 border-b border-[#2A332B] bg-[#1E251F] px-4 py-3">
            <span className="h-[10px] w-[10px] rounded-full bg-amber" />
            <span className="h-[10px] w-[10px] rounded-full bg-[#7FB89A]" />
            <span className="h-[10px] w-[10px] rounded-full bg-[#5A6B5D]" />
            <span className="ml-2 font-mono text-xs text-[#8B9A8E]">quest_02_loops.py</span>
          </div>

          <div className="px-[22px] pb-5 pt-[22px] font-mono text-[13.5px] leading-[1.85] text-[#D9E3DB]">
            <p className="text-[#8B9A8E]"># desafio: some os números de 1 a 10</p>
            <p>
              <span className="text-[#7FB89A]">total</span> = <span className="text-amber">0</span>
            </p>
            <p>
              <span className="text-[#5FCB88]">for</span> n <span className="text-[#5FCB88]">in</span> range(
              <span className="text-amber">1</span>, <span className="text-amber">11</span>):
            </p>
            <p>&nbsp;&nbsp;total += n</p>
            <p className="mt-3">print(total)</p>
            <p>
              <span className="text-[#8B9A8E]">&gt;&gt;&gt;</span> 55{' '}
              <span className="text-[#7FB89A]">✓ correto</span>
              <span className="ml-1 inline-block h-[15px] w-[7px] animate-blink align-middle bg-[#7FB89A]" />
            </p>

            <div className="mt-[18px] border-t border-dashed border-[#2A332B] pt-4">
              <div className="mb-2 flex justify-between text-[11.5px] text-[#8B9A8E]">
                <span>XP do módulo</span>
                <span>640 / 1000</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#2A332B]">
                <div className="h-full w-0 animate-fillxp rounded-full bg-gradient-to-r from-[#5FCB88] to-amber" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
