'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/ui/button'
import { Calendar } from '@/ui/calendar'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/ui/command'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/ui/form'
import { Input } from '@/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/ui/popover'
import { ScrollArea } from '@/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { classValidatorResolver } from '@hookform/resolvers/class-validator'
import { CreateLoanDto, IBook, ILoan } from '@repo/common'

interface ExtendedCreateLoanDto extends CreateLoanDto {
  userId?: number
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  guestDni?: string
}
import { Label } from '@/ui/label'
import { RadioGroup, RadioGroupItem } from '@/ui/radio-group'
import { useBooks, useLoans, useUsers } from '@repo/hooks'
import { format, set } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, BookOpen, CalendarIcon, Clock, User, UserPlus } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Toaster, toast } from 'sonner'
import { CalendarPicker } from '../calendar/calendar-picker'
import { useModalCrud } from '@/contexts/modal-crud-context'


const hours = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return { value: `${hour}:00`, label: `${hour}:00` }
})
export function LoanForm() {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  )
  const [selectedTime, setSelectedTime] = useState('14:00') // Default to 2:00 PM
  const [userType, setUserType] = useState<'registered' | 'guest'>('registered')

  const {
    hook: {
      createLoan,
      
    },
	setCreateOpen,
  } = useModalCrud<ILoan, ReturnType<typeof useLoans>>()
  const { fullBooks } = useBooks({ page: 1, searchTerm: '' })
  const { getUsersByRole } = useUsers({ page: 1, searchTerm: '' })
  const usersQuery = getUsersByRole()
  // Define form with default values
  const form = useForm<ExtendedCreateLoanDto>({
    defaultValues: {
      bookId: 0,
      quantity: 1,
      returnDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default to 2 weeks from now
    },
    mode: 'onBlur',
  })
  useEffect(() => {
    if (selectedDate) {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const combinedDateTime = set(selectedDate, { hours, minutes, seconds: 0 })
      form.setValue('returnDate', combinedDateTime)
    }
  }, [selectedDate, selectedTime, form])
  useEffect(() => {
    fullBooks.mutate()
  }, [fullBooks])

  // Handle form submission
  function onSubmit(values: ExtendedCreateLoanDto) {
    if (
      userType === 'guest' &&
      (!values.guestName || !values.guestEmail || !values.guestDni)
    ) {
      toast.error('Nombre, email y DNI son requeridos para invitados')
      return
    }
	toast.promise(createLoan.mutateAsync(values),{
		success: 'Prestamo creado satisfactoriamente',
		error: 'Error creando el prestamo'
	})
    setCreateOpen(false)
  }

  return (
     <Card className="w-full max-w-3xl mx-auto shadow-lg border-border/50">
      <Toaster position="top-right" richColors />
      <CardHeader className="space-y-1 pb-6 border-b bg-muted/30">
        <CardTitle className="text-2xl font-bold tracking-tight">Registrar Nuevo Préstamo</CardTitle>
        <CardDescription className="text-base">
          Complete el formulario para registrar un préstamo en el sistema de biblioteca
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 px-6 pb-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4 p-4 rounded-lg border bg-card">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Tipo de Usuario
              </Label>
              <RadioGroup
                value={userType}
                onValueChange={(value: "registered" | "guest") => setUserType(value)}
                className="grid grid-cols-2 gap-3"
              >
                <div className="relative">
                  <RadioGroupItem value="registered" id="registered" className="peer sr-only" />
                  <Label
                    htmlFor="registered"
                    className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-background px-4 py-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                  >
                    <User className="h-4 w-4" />
                    Usuario Registrado
                  </Label>
                </div>
                <div className="relative">
                  <RadioGroupItem value="guest" id="guest" className="peer sr-only" />
                  <Label
                    htmlFor="guest"
                    className="flex items-center justify-center gap-2 rounded-md border-2 border-muted bg-background px-4 py-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                  >
                    <UserPlus className="h-4 w-4" />
                    Invitado
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="bookId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Libro</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between h-11 hover:bg-accent transition-colors",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <span className="mr-2 truncate flex-1 text-left">
                              {field.value
                                ? fullBooks.data?.data?.find((book: IBook) => book.id === field.value)?.title
                                : "Seleccione un libro"}
                            </span>
                            <BookOpen className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 shadow-xl">
                        <Command>
                          <CommandInput placeholder="Buscar libro..." className="h-11" />
                          <CommandList>
                            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                              No se encontraron libros.
                            </CommandEmpty>
                            <CommandGroup>
                              <ScrollArea className="h-72">
                                {fullBooks.data?.data?.map((book: IBook) => (
                                  <CommandItem
                                    key={book.id}
                                    value={book.title}
                                    onSelect={() => {
                                      form.setValue("bookId", book.id)
                                      setOpen(false)
                                    }}
                                    className="cursor-pointer"
                                  >
                                    {book.title}
                                  </CommandItem>
                                ))}
                              </ScrollArea>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="text-xs">Seleccione el libro a prestar</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Cantidad</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        className="h-11"
                        {...field}
                        onChange={(e) => {
                          field.onChange(Number.parseInt(e.target.value))
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">Número de ejemplares a prestar</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <AnimatePresence mode="wait">
              {userType === "registered" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-semibold">Usuario Registrado</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(Number(value))}
                          value={field.value?.toString()}
                        >
                          <SelectTrigger className="h-11 hover:bg-accent transition-colors">
                            <SelectValue placeholder="Seleccione un usuario" />
                          </SelectTrigger>
                          <SelectContent>
                            <ScrollArea className="h-64">
                              {usersQuery.data?.data?.items?.map((user: any) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.name} {user.surname}
                                </SelectItem>
                              ))}
                            </ScrollArea>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          Seleccione el usuario que realizará el préstamo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}

              {userType === "guest" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-lg border bg-muted/30 space-y-5"
                >
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Información del Invitado
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="guestName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Nombre Completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre completo" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="guestEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@ejemplo.com" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="guestPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Teléfono</FormLabel>
                          <FormControl>
                            <Input placeholder="Número de teléfono" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="guestDni"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">DNI</FormLabel>
                          <FormControl>
                            <Input placeholder="Número de DNI" className="h-11" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <FormField
              control={form.control}
              name="returnDate"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-sm font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Fecha y Hora de Devolución
                  </FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3 p-4 rounded-lg border bg-card">
                    <div className="flex-1">
                      <CalendarPicker value={selectedDate} onChange={setSelectedDate} />
                    </div>
                    <div className="w-full">
                      <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Hora
                      </Label>
                      <Select
                        value={selectedTime}
                        onValueChange={(value) => {
                          setSelectedTime(value)
                        }}
                      >
                        <SelectTrigger className="w-full h-11">
                          <SelectValue placeholder="Hora" />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-72">
                            {hours.map((hour) => (
                              <SelectItem key={hour.value} value={hour.value}>
                                {hour.label}
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <FormDescription className="text-xs">
                    Seleccione la fecha y hora límite para devolver el libro
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-end gap-3 px-6 py-5 border-t bg-muted/30">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            form.reset()
            setCreateOpen(false)
          }}
          className="min-w-[100px] h-11"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          onClick={form.handleSubmit(onSubmit)}
          disabled={!form.formState.isValid}
          className="min-w-[140px] h-11 font-semibold"
        >
          Crear Préstamo
        </Button>
      </CardFooter>
    </Card>
  )
}
