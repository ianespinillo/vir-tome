'use client'
import { useMyStats } from '@repo/hooks'
import {StatCard, UpcomingCard, AlertsPanel, LoansPanel, BookOpen, Clock, AlertTriangle, CheckCircle} from '@repo/ui'
import React from 'react'

export default function CommonUserDash() {
    const {myAlerts, myLastLoans, myStats} = useMyStats()
    const {active,dueSoon, overdue, returned} = myStats.data?.data ?? {}
  return (
    <div className="flex h-full flex-col overflow-hidden p-4">
      <div className="grid h-full grid-cols-4 grid-rows-[auto_1fr] gap-3">
        {/* Stats Row */}
        <StatCard icon={BookOpen} label="Activos" value={active ?? 0} iconClassName="text-primary" bgClassName="bg-primary/10" />
        <StatCard
          icon={Clock}
          label="Por Vencer"
          value={dueSoon ?? 0}
          iconClassName="text-amber-600"
          bgClassName="bg-amber-500/10"
        />
        <StatCard
          icon={AlertTriangle}
          label="Vencidos"
          value={overdue ?? 0}
          iconClassName="text-destructive"
          bgClassName="bg-destructive/10"
        />
        <StatCard
          icon={CheckCircle}
          label="Devueltos"
          value={returned ?? 0}
          iconClassName="text-emerald-600"
          bgClassName="bg-emerald-500/10"
        />

        {/* Préstamos Activos - 2 columnas */}
        <LoansPanel loans={myLastLoans.data?.data?.items ?? []} className="col-span-2 row-span-1" />

        {/* Vencimientos y Alertas - columna derecha */}
        <div className="col-span-2 row-span-1 grid grid-rows-2 gap-3">
          <UpcomingCard items={myAlerts.data?.data ?? []} />
          <AlertsPanel alerts={myAlerts.data?.data ?? []} />
        </div>
      </div>
    </div>
  )
}
