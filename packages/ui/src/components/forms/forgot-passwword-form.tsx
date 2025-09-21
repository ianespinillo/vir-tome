import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/ui/card'
import { Input } from '@/ui/input'
import { Button } from '@/ui/button'
import { Label } from '@/ui/label'
import { Mail } from 'lucide-react'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { classValidatorResolver } from '@hookform/resolvers/class-validator'
import { ForgotPasswordDTO } from '@repo/common'

export const ForgotPasswordForm = () => {
    const [error, setError] = useState<null | string>(null)
    const {handleSubmit, formState:{errors, isSubmitting, isValid}, register} = useForm({
        resolver: classValidatorResolver(ForgotPasswordDTO)
    })
    const onSubmit = handleSubmit((data)=>{
        console.log(data)
    })
  return (
    <div className="h-screen flex items-center justify-center">
      <Card className="w-full max-w-md shadow-lg transition-all duration-300 hover:shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Olvidé mi contraseña</CardTitle>
          <CardDescription>
            {error && (
              <div className="flex items-center justify-center rounded-md bg-red-500 px-4 py-3 text-white">
                <p>{error}</p>
              </div>
            )}
            Por favor ingrese sus datos para recuperar su contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Ingrese su email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 bg-input"
                  required
                  {...register('email')}
                />
                {errors.email && (
                  <span className="text-red-500">
                    {errors.email.message as string}
                  </span>
                )}
              </div>
            </div>
            <Button
              type="submit"
              className="w-full transition-all duration-300 hover:shadow-md"
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
