import { useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'

import { API_URL } from '../lib/api'

export default function Register() {

  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    acceptedTerms: false,
  })

  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  function validate() {
    const next = {}

    if (!form.email.trim()) {
      next.email = 'Informe seu e-mail.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'E-mail em formato inválido.'
    }

    if (!form.username.trim()) {
      next.username = 'Escolha um nome de usuário.'
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
      next.username = 'Use de 3 a 20 letras, números ou _ (sem espaços).'
    }

    if (!form.birthDate) {
      next.birthDate = 'Informe sua data de nascimento.'
    } else if (new Date(form.birthDate).getTime() >= Date.now()) {
      next.birthDate = 'Data de nascimento inválida.'
    }

    if (!form.password) {
      next.password = 'Crie uma senha.'
    } else if (form.password.length < 6) {
      next.password = 'A senha precisa ter pelo menos 6 caracteres.'
    }

    if (form.confirmPassword !== form.password) {
      next.confirmPassword = 'As senhas não coincidem.'
    }

    // IMPLEMENTAÇÃO DOS TERMOS
    if (!form.acceptedTerms) {
      next.acceptedTerms = 'Você precisa aceitar os Termos e Condições para continuar.'
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

      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          username: form.username,
          senha: form.password,
          dataNascimento: form.birthDate,
          // IMPLEMENTAÇÃO DOS TERMOS ENVIADA PARA O BACKEND
          aceitouTermos: form.acceptedTerms,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ email: data.erro || 'Não foi possível criar a conta.' })
        setStatus('idle')
        return
      }

      navigate('/login')

    } catch (err) {

      setErrors({
        email: 'Não foi possível conectar ao servidor. Ele está rodando?'
      })

      setStatus('idle')
    }
  }

  return (

    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">

      <div className="w-full max-w-[400px]">

        <Link
          to="/"
          className="mb-10 flex items-center justify-center gap-2 font-display text-[19px] font-bold text-ink"
        >
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-forest font-mono text-[13px] font-semibold text-paper">
            &gt;_
          </span>
          PyQuest
        </Link>

        <div className="rounded-2xl border border-line bg-paper-soft p-8 shadow-[0_20px_50px_-24px_rgba(22,29,24,0.25)]">

          <h1 className="mb-1 font-display text-[26px] font-bold text-ink">
            Crie sua conta
          </h1>

          <p className="mb-7 text-[14px] text-ink-soft">
            Comece sua jornada em Python gratuitamente, sem cartão de crédito.
          </p>

          <form onSubmit={handleSubmit} noValidate>

            <label
              htmlFor="username"
              className="mb-1 block text-[13px] font-medium text-ink"
            >
              Nome de usuário
            </label>

            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              placeholder="ex: ana_python"
              className={`mb-1 w-full rounded-[10px] border bg-paper px-3.5 py-[10px] text-[14px] text-ink outline-none transition-colors focus:border-forest ${
                errors.username ? 'border-red-400' : 'border-line'
              }`}
            />

            {errors.username && (
              <p className="mb-3 text-[12.5px] text-red-500">
                {errors.username}
              </p>
            )}

            {!errors.username && <div className="mb-3" />}


            <label
              htmlFor="email"
              className="mb-1 block text-[13px] font-medium text-ink"
            >
              E-mail
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="voce@email.com"
              className={`mb-1 w-full rounded-[10px] border bg-paper px-3.5 py-[10px] text-[14px] text-ink outline-none transition-colors focus:border-forest ${
                errors.email ? 'border-red-400' : 'border-line'
              }`}
            />

            {errors.email && (
              <p className="mb-3 text-[12.5px] text-red-500">
                {errors.email}
              </p>
            )}

            {!errors.email && <div className="mb-3" />}


            <label
              htmlFor="birthDate"
              className="mb-1 block text-[13px] font-medium text-ink"
            >
              Data de nascimento
            </label>

            <input
              id="birthDate"
              name="birthDate"
              type="date"
              value={form.birthDate}
              onChange={handleChange}
              className={`mb-1 w-full rounded-[10px] border bg-paper px-3.5 py-[10px] text-[14px] text-ink outline-none transition-colors focus:border-forest ${
                errors.birthDate ? 'border-red-400' : 'border-line'
              }`}
            />

            <p className="mb-1 text-[11.5px] text-ink-soft">
              Usada apenas para confirmar sua identidade caso precise redefinir a senha.
            </p>

            {errors.birthDate && (
              <p className="mb-3 text-[12.5px] text-red-500">
                {errors.birthDate}
              </p>
            )}

            {!errors.birthDate && <div className="mb-3" />}


            <label
              htmlFor="password"
              className="mb-1 block text-[13px] font-medium text-ink"
            >
              Senha
            </label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo de 6 caracteres"
              className={`mb-1 w-full rounded-[10px] border bg-paper px-3.5 py-[10px] text-[14px] text-ink outline-none transition-colors focus:border-forest ${
                errors.password ? 'border-red-400' : 'border-line'
              }`}
            />

            {errors.password && (
              <p className="mb-3 text-[12.5px] text-red-500">
                {errors.password}
              </p>
            )}

            {!errors.password && <div className="mb-3" />}


            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-[13px] font-medium text-ink"
            >
              Confirmar senha
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className={`mb-1 w-full rounded-[10px] border bg-paper px-3.5 py-[10px] text-[14px] text-ink outline-none transition-colors focus:border-forest ${
                errors.confirmPassword ? 'border-red-400' : 'border-line'
              }`}
            />

            {errors.confirmPassword && (
              <p className="mb-3 text-[12.5px] text-red-500">
                {errors.confirmPassword}
              </p>
            )}

            {!errors.confirmPassword && <div className="mb-3" />}


            {/* TERMOS E CONDIÇÕES */}
            <label className="mb-1 flex items-start gap-2 text-[13px] text-ink-soft">

              <input
                type="checkbox"
                name="acceptedTerms"
                checked={form.acceptedTerms}
                onChange={handleChange}
                className="mt-[3px] h-[15px] w-[15px] shrink-0 rounded border-line accent-forest"
              />

              <span>
                Li e concordo com os{' '}

                <Link
                  to="/termos"
                  className="font-medium text-forest hover:underline"
                >
                  Termos e Condições
                </Link>
                .
              </span>

            </label>

            {errors.acceptedTerms && (
              <p className="mb-3 text-[12.5px] text-red-500">
                {errors.acceptedTerms}
              </p>
            )}

            {!errors.acceptedTerms && <div className="mb-5" />}


            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-full bg-forest py-[11px] text-[14.5px] font-semibold text-paper transition-colors hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-70"
            >
              {status === 'loading'
                ? 'Criando conta...'
                : 'Criar conta gratuita'}
            </button>

          </form>

        </div>

        <p className="mt-6 text-center text-[13.5px] text-ink-soft">

          Já tem conta?{' '}

          <Link
            to="/login"
            className="font-medium text-forest hover:underline"
          >
            Entrar
          </Link>

        </p>

      </div>

    </div>
  )
}
