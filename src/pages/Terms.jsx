import { Link } from 'react-router-dom'

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 font-display text-[19px] font-bold text-ink">{title}</h2>
      <div className="space-y-3 text-[14.5px] leading-relaxed text-ink-soft">{children}</div>
    </section>
  )
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-paper">
      <nav className="sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-display text-[17px] font-bold text-ink">
            <span className="flex h-[24px] w-[24px] items-center justify-center rounded-[6px] bg-forest font-mono text-[12px] font-semibold text-paper">&gt;_</span>
            PyQuest
          </Link>
          <Link to="/register" className="text-[13.5px] font-medium text-ink-soft hover:text-ink">Voltar ao cadastro</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-sage px-3 py-1 font-mono text-[11.5px] font-medium text-forest-deep">
          ÚLTIMA ATUALIZAÇÃO: SETEMBRO DE 2026
        </span>
        <h1 className="mb-8 font-display text-[30px] font-bold text-ink">Termos e Condições de Uso</h1>

        <p className="mb-8 text-[14.5px] leading-relaxed text-ink-soft">
          Estes Termos e Condições regulam o uso da plataforma PyQuest.
          Ao criar uma conta, você declara que leu, entendeu e concorda integralmente com o disposto
          neste documento. Caso não concorde, não utilize a Plataforma.
        </p>

        <Section title="1. Descrição do serviço">
          <p>
            O PyQuest é uma plataforma educacional gratuita voltada ao ensino introdutório da linguagem
            Python, por meio de desafios de programação organizados em módulos progressivos,
            acompanhamento de progresso e experiência gamificada.
          </p>
          <p>
            A Plataforma é oferecida no estado em que se encontra, podendo passar por
            atualizações, correções e mudanças de funcionalidade a qualquer momento, sem aviso prévio.
          </p>
        </Section>

        <Section title="2. Cadastro e conta do usuário">
          <p>
            Para utilizar os recursos da Plataforma, é necessário criar uma conta informando e-mail,
            nome de usuário, data de nascimento e senha. Você se compromete a:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Fornecer informações verdadeiras, completas e atualizadas no cadastro;</li>
            <li>Manter sua senha em sigilo e não compartilhar sua conta com terceiros;</li>
            <li>Notificar-nos imediatamente em caso de uso não autorizado da sua conta;</li>
            <li>Ser o único responsável por todas as atividades realizadas na sua conta.</li>
          </ul>
          <p>
            A Plataforma é destinada a usuários com capacidade legal para aceitar estes Termos.
            Caso você seja menor de idade, o uso da Plataforma deve ocorrer com autorização e
            supervisão de um responsável legal.
          </p>
        </Section>

        <Section title="3. Uso aceitável">
          <p>Ao usar o PyQuest, você concorda em não:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Utilizar a Plataforma para fins ilegais ou não autorizados;</li>
            <li>Tentar acessar contas de outros usuários ou áreas restritas do sistema;</li>
            <li>Interferir no funcionamento da Plataforma (ex: sobrecarregar servidores, explorar falhas de segurança);</li>
            <li>Reproduzir, distribuir ou comercializar o conteúdo da Plataforma sem autorização.</li>
          </ul>
        </Section>

        <Section title="4. Proteção de dados pessoais">
          <p>
            Tratamos seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados
            (Lei nº 13.709/2018 — LGPD). Coletamos e armazenamos apenas os dados necessários para o
            funcionamento da Plataforma: e-mail, nome de usuário, data de nascimento (usada para
            confirmar sua identidade em caso de redefinição de senha) e o histórico de progresso nos
            desafios.
          </p>
          <p>
            Sua senha nunca é armazenada em texto legível — apenas um hash criptográfico irreversível
            é guardado no banco de dados. Não compartilhamos seus dados pessoais com terceiros para
            fins comerciais.
          </p>
          <p>
            Você pode, a qualquer momento, solicitar a exclusão da sua conta e dos dados associados a
            ela, entrando em contato pelos canais informados na seção 7.
          </p>
        </Section>

        <Section title="5. Propriedade intelectual">
          <p>
            Todo o conteúdo da Plataforma — incluindo textos, exercícios, marca, layout e código-fonte
            da interface — pertence ao PyQuest ou a seus licenciadores, sendo protegido por leis de
            propriedade intelectual. É vedada a reprodução total ou parcial sem autorização prévia.
          </p>
        </Section>

        <Section title="6. Limitação de responsabilidade">
          <p>
            A Plataforma é oferecida gratuitamente, com fins educacionais. Não garantimos
            disponibilidade ininterrupta do serviço nem nos responsabilizamos por eventuais perdas de
            progresso decorrentes de falhas técnicas, manutenção ou indisponibilidade de
            infraestrutura de terceiros utilizada para hospedagem.
          </p>
        </Section>

        <Section title="7. Alterações nestes Termos e contato">
          <p>
            Podemos atualizar estes Termos periodicamente. Alterações significativas serão comunicadas
            na própria Plataforma. O uso continuado após uma atualização representa concordância com
            os novos Termos.
          </p>
          <p>
            Dúvidas sobre estes Termos ou sobre o tratamento dos seus dados podem ser enviadas para o
            e-mail de contato divulgado na página inicial da Plataforma.
          </p>
        </Section>

        
      </main>
    </div>
  )
}
