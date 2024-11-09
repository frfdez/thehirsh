'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../firebase/firebaseConfig"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import Link from 'next/link'

interface LoginProps {
  onLogin: (username: string) => void
}

export default function Login({ onLogin }: LoginProps = { onLogin: () => {} }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    try {
      if (username.trim() && password.trim()) {
        await signInWithEmailAndPassword(auth, username, password)
        router.push('/dashboard')
        onLogin(username)
      }
    } catch (err: any) {
      setError("Error en el inicio de sesión: " + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-12 text-pink-300">HIRSH</h1>
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-semibold text-white">Bienvenido a The Hirsh</h2>
              <p className="text-zinc-400">por favor ingresa tus credenciales para continuar</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-zinc-200">Correo electronico</label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu correo"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-zinc-200">Contraseña</label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" className="border-zinc-700 data-[state=checked]:bg-pink-300 data-[state=checked]:border-pink-300" />
                  <label htmlFor="remember" className="text-sm text-zinc-300">
                    Recuerdame
                  </label>
                </div>
                <Link href="/forgot-password" className="text-sm text-zinc-300 hover:text-pink-300">
                  Olvidaste tu contraseña?
                </Link>
              </div>

              <Button 
                onClick={handleLogin}
                className="w-full bg-pink-300 hover:bg-pink-400 text-zinc-900 font-medium"
              >
                Ingresar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}