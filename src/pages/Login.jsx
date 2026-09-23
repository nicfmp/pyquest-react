import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../lib/api'
import { saveToken } from '../lib/auth'
import { useProgress } from '../context/ProgressContext'

export default function Login() {
  const navigate = useNavigate()
  const { loadUser } = useProgress()

  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | loading

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function validate() {
    const next = {}
    if (!form.email.trim()) {
      next.email = 'Informe seu e-mail.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'E-mail em formato inválido.'
    }
    if (!form.password) {
      next.password = 'Informe sua senha.'
    } else if (form.password.length < 6) {
      next.password = 'A senha precisa ter pelo menos 6 caracteres.'
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
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, senha: form.password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ password: data.erro || 'Não foi possível entrar.' })
        setStatus('idle')
        return
      }

      saveToken(data.token, form.remember)
      await loadUser() // já popula o contexto com usuário + progresso vindos do backend
      navigate('/dashboard')
    } catch (err) {
      setErrors({ password: 'Não foi possível conectar ao servidor. Ele está rodando?' })
      setStatus('idle')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-[400px]">
        <Link to="/" className="mb-10 flex items-center justify-center gap-2 font-display text-[19px] font-bold text-ink">
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-forest font-mono text-[13px] font-semibold text-paper">&gt;_</span>
          PyQuest
        </Link>

        <div className="rounded-2xl border border-line bg-paper-soft p-8 shadow-[0_20px_50px_-24px_rgba(22,29,24,0.25)]">
          <h1 className="mb-1 font-display text-[26px] font-bold text-ink">Bem-vindo de volta</h1>
          <p className="mb-7 text-[14px] text-ink-soft">Entre para continuar sua jornada e não perder seu progresso.</p>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="email" className="mb-1 block text-[13px] font-medium text-ink">E-mail</label>
            <input
              id="email" name="email" type="email" autoComplete="email"
              value={form.email} onChange={handleChange} placeholder="voce@email.com"
              className={`mb-1 w-full rounded-[10px] border bg-paper px-3.5 py-[10px] text-[14px] text-ink outline-none transition-colors focus:border-forest ${errors.email ? 'border-red-400' : 'border-line'}`}
            />
            {errors.email && <p className="mb-3 text-[12.5px] text-red-500">{errors.email}</p>}
            {!errors.email && <div className="mb-3" />}

            <label htmlFor="password" className="mb-1 block text-[13px] font-medium text-ink">Senha</label>
            <input
              id="password" name="password" type="password" autoComplete="current-password"
              value={form.password} onChange={handleChange} placeholder="••••••••"
              className={`mb-1 w-full rounded-[10px] border bg-paper px-3.5 py-[10px] text-[14px] text-ink outline-none transition-colors focus:border-forest ${errors.password ? 'border-red-400' : 'border-line'}`}
            />
            {errors.password && <p className="mb-3 text-[12.5px] text-red-500">{errors.password}</p>}
            {!errors.password && <div className="mb-3" />}

            <div className="mb-6 flex items-center justify-between text-[13px]">
              <label className="flex items-center gap-2 text-ink-soft">
                <input type="checkbox" name="remember" checked={form.remember} onChange={handleChange} className="h-[15px] w-[15px] rounded border-line accent-forest" />
                Lembrar de mim
              </label>
              <Link to="/reset-password" className="font-medium text-forest hover:underline">Esqueceu a senha?</Link>
            </div>

            <button
              type="submit" disabled={status === 'loading'}
              className="w-full rounded-full bg-forest py-[11px] text-[14.5px] font-semibold text-paper transition-colors hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'loading' ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[13.5px] text-ink-soft">
          Ainda não tem conta?{' '}
          <Link to="/register" className="font-medium text-forest hover:underline">Criar conta gratuita</Link>
        </p>
      </div>
    </div>
  )
}
