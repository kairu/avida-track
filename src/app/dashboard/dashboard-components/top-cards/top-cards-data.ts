export interface topcard {
    bgcolor: string,
    icon: string,
    title: string,
    subtitle: string
}

export const topcards: topcard[] = [

    {
        bgcolor: 'danger',
        icon: 'bi bi-arrow-right',
        title: '5',
        subtitle: 'Pending Receipts'
    },
    {
        bgcolor: 'info',
        icon: 'bi bi-receipt',
        title: '5',
        subtitle: 'Review Receipts'
    },
    {
        bgcolor: 'danger',
        icon: 'bi bi-person-x-fill',
        title: '100',
        subtitle: 'Validate User'
    },
    {
        bgcolor: 'success',
        icon: 'bi bi-person-fill',
        title: '100',
        subtitle: 'Registered Owners'
    },
    {
        bgcolor: 'info',
        icon: 'bi bi-people-fill',
        title: '100',
        subtitle: 'Registered Tenants'
    },
] 