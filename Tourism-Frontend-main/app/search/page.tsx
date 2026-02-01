'use client'

import { Suspense } from 'react'
import SearchPageContent from './SearchPageContent'

export default function Page() {
    return (
        <Suspense fallback={<div className='p-6'>Loading...</div>}>
            <SearchPageContent />
        </Suspense>
    )
}
