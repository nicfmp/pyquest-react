import { useEffect, useState } from 'react'

const PYODIDE_SCRIPT_SRC = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js'

let pyodideSingleton = null

export function usePyodide() {
  const [pyodide, setPyodide] = useState(pyodideSingleton)
  const [status, setStatus] = useState(pyodideSingleton ? 'ready' : 'loading')

  useEffect(() => {
    if (pyodideSingleton) {
      setPyodide(pyodideSingleton)
      setStatus('ready')
      return
    }

    let cancelled = false

    async function load() {
      try {
        if (!window.loadPyodide) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.src = PYODIDE_SCRIPT_SRC
            script.onload = resolve
            script.onerror = reject
            document.body.appendChild(script)
          })
        }

        const instance = await window.loadPyodide()
        if (cancelled) return

        pyodideSingleton = instance
        setPyodide(instance)
        setStatus('ready')
      } catch (err) {
        if (!cancelled) setStatus('error')
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  async function runPython(code) {
    if (!pyodide) throw new Error('Python ainda não carregou.')

    pyodide.runPython('import sys, io\nsys.stdout = io.StringIO()')
    try {
      await pyodide.runPythonAsync(code)
      const output = pyodide.runPython('sys.stdout.getvalue()')
      return { output: output.replace(/\n$/, ''), error: null }
    } catch (err) {
      return { output: '', error: err.message }
    } finally {
      pyodide.runPython('sys.stdout = sys.__stdout__')
    }
  }

  return { status, runPython }
}
