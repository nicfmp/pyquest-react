import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../lib/api'

export default function ResetPassword() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | loading | success

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function validate() {
    const next = {}
    if (!form.email.trim()) {
      next.email = 'Informe seu e-mail.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'E-mail em formato inválido.'
    }
    if (!form.birthDate) {
      next.birthDate = 'Informe a data de nascimento usada no cadastro.'
    }
    if (!form.password) {
      next.password = 'Crie uma nova senha.'
    } else if (form.password.length < 6) {
      next.password = 'A senha precisa ter pelo menos 6 caracteres.'
    }
    if (form.confirmPassword !== form.password) {
      next.confirmPassword = 'As senhas não coincidem.'
    }
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setStatus('loading')

    try {
      const res = await fetch(`${API_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          dataNascimento: form.birthDate,
          novaSenha: form.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ birthDate: data.erro || 'Não foi possível redefinir a senha.' })
        setStatus('idle')
        return
      }

      setStatus('success')
    } catch (err) {
      setErrors({ birthDate: 'Não foi possível conectar ao servidor. Ele está rodando?' })
      setStatus('idle')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
        <div className="w-full max-w-[400px] rounded-2xl border border-line bg-paper-soft p-8 text-center shadow-[0_20px_50px_-24px_rgba(22,29,24,0.25)]">
          <h1 className="mb-2 font-display text-[22px] font-bold text-ink">Senha redefinida!</h1>
          <p className="mb-6 text-[14px] text-ink-soft">Já pode entrar com a sua nova senha.</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full rounded-full bg-forest py-[11px] text-[14.5px] font-semibold text-paper hover:bg-forest-deep"
          >
            Ir para o login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-[400px]">
        <Link to="/" className="mb-10 flex items-center justify-center gap-2 font-display text-[19px] font-bold text-ink">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-forest font-mono text-[13px] font-semibold text-paper">&gt;_</span>
          PyQuest
        </Link>

        <div className="rounded-2xl border border-line bg-paper-soft p-8 shadow-[0_20px_50px_-24px_rgba(22,29,24,0.25)]">
          <h1 className="mb-1 font-display text-[26px] font-bold text-ink">Redefinir senha</h1>
          <p className="mb-7 text-[14px] text-ink-soft">
            Confirme seu e-mail e sua data de nascimento para criar uma nova senha.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="email" className="mb-1 block text-[13px] font-medium text-ink">E-mail</label>
            <input
              id="email" name="email" type="email" autoComplete="email"
              value={form.email} onChange={handleChange} placeholder="voce@email.com"
              className={`mb-1 w-full rounded-[10px] border bg-paper px-3.5 py-[10px] text-[14px] text-ink outline-none transition-colors focus:border-forest ${errors.email ? 'border-red-400' : 'border-line'}`}
            />
            {errors.email && <p className="mb-3 text-[12.5px] text-red-500">{errors.email}</p>}
            {!errors.email && <div className="mb-3" />}

            <label htmlFor="birthDate" className="mb-1 block text-[13px] font-medium text-ink">Data de nascimento</label>
            <input
              id="birthDate" name="birthDate" type="date"
              value={form.birthDate} onChange={handleChange}
              className={`mb-1 w-full rounded-[10px] border bg-paper px-3.5 py-[10px] text-[14px] text-ink outline-none transition-colors focus:border-forest ${errors.birthDate ? 'border-red-400' : 'border-line'}`}
            />
            {errors.birthDate && <p className="mb-3 text-[12.5px] text-red-500">{errors.birthDate}</p>}
            {!errors.birthDate && <div className="mb-3" />}

            <label htmlFor="password" className="mb-1 block text-[13px] font-medium text-ink">Nova senha</label>
            <input
              id="password" name="password" type="password" autoComplete="new-password"
              value={form.password} onChange={handleChange} placeholder="Mínimo de 6 caracteres"
              className={`mb-1 w-full rounded-[10px] border bg-paper px-3.5 py-[10px] text-[14px] text-ink outline-none transition-colors focus:border-forest ${errors.password ? 'border-red-400' : 'border-line'}`}
            />
            {errors.password && <p className="mb-3 text-[12.5px] text-red-500">{errors.password}</p>}
            {!errors.password && <div className="mb-3" />}

            <label htmlFor="confirmPassword" className="mb-1 block text-[13px] font-medium text-ink">Confirmar nova senha</label>
            <input
              id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password"
              value={form.confirmPassword} onChange={handleChange} placeholder="••••••••"
              className={`mb-1 w-full rounded-[10px] border bg-paper px-3.5 py-[10px] text-[14px] text-ink outline-none transition-colors focus:border-forest ${errors.confirmPassword ? 'border-red-400' : 'border-line'}`}
            />
            {errors.confirmPassword && <p className="mb-3 text-[12.5px] text-red-500">{errors.confirmPassword}</p>}
            {!errors.confirmPassword && <div className="mb-5" />}

            <button
              type="submit" disabled={status === 'loading'}
              className="w-full rounded-full bg-forest py-[11px] text-[14.5px] font-semibold text-paper transition-colors hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'loading' ? 'Redefinindo...' : 'Redefinir senha'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[13.5px] text-ink-soft">
          Lembrou a senha?{' '}
          <Link to="/login" className="font-medium text-forest hover:underline">Voltar para o login</Link>
        </p>
      </div>
    </div>
  )
}
