import { Link } from 'react-router-dom'

export default function CtaBand() {
  return (
    <section id="sobre" className="bg-forest-deep py-16 text-center text-paper">
      <div className="mx-auto max-w-6xl px-8">
        <h2 className="mb-[14px] font-display text-[32px] font-bold">Sua próxima linha de código começa agora.</h2>
        <p className="mb-[30px] text-[15px] text-[#BFD3C6]">Grátis para começar. Sem cartão de crédito.</p>
        <Link to="/register" className="inline-flex items-center justify-center rounded-full bg-amber px-[22px] py-3 text-[14.5px] font-semibold text-ink transition-transform hover:-translate-y-px hover:bg-[#D6982D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper">Começar jornada gratuita</Link>
      </div>
    </section>
  )
}
