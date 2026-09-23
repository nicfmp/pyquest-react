import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { API_URL } from '../lib/api'
import { getToken, clearToken } from '../lib/auth'

const ProgressContext = createContext(null)

export function ProgressProvider({ children }) {
  const [user, setUser] = useState(null)
  const [progress, setProgress] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | ready | guest

  // Busca o usuário e o progresso salvos no backend, a partir do token guardado.
  // Chamado automaticamente ao abrir o app e manualmente logo após o login.
  const loadUser = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setProgress(null)
      setStatus('guest')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch(`${API_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        clearToken()
        setUser(null)
        setProgress(null)
        setStatus('guest')
        return
      }

      const data = await res.json()
      setUser(data.usuario)
      setProgress(data.progress)
      setStatus('ready')
    } catch (err) {
      // Backend fora do ar: não desloga o usuário, só fica sem dados atualizados.
      setStatus('guest')
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Avisa o backend que um desafio foi concluído. O backend valida, soma XP
  // e devolve o progresso atualizado — já persistido no MongoDB.
  async function completeNextChallenge(questId) {
    const token = getToken()
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/api/progress/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questId }),
      })

      if (!res.ok) return
      const data = await res.json()
      setProgress(data.progress)
    } catch (err) {
      // Sem conexão: o desafio some como "resolvido" na tela, mas o XP
      // só é confirmado na próxima chamada bem-sucedida.
    }
  }

  function logout() {
    clearToken()
    setUser(null)
    setProgress(null)
    setStatus('guest')
  }

  return (
    <ProgressContext.Provider value={{ user, progress, status, loadUser, completeNextChallenge, logout }}>
      {children}
    </ProgressContext.Provider>
  )
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress precisa estar dentro de um ProgressProvider')
  return ctx
}
