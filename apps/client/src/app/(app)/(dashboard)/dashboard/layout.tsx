'use client'
import { ROLES } from '@repo/common';
import { useAuth } from '@repo/hooks';
import React from 'react'

export default function DashPageLayout({admins, common}: Readonly<{ admins: React.ReactNode; common: React.ReactNode }>) {
    const {session} = useAuth();
    if (session.isLoading || session.isRefetching ) {
        return <div>Loading...</div>;
    }
    if (session.data?.data?.roleName === ROLES.STUDENT || session.data?.data?.roleName === ROLES.TEACHER) {
        return common;
    }
    return admins;
}
