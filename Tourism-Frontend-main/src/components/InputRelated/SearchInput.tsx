'use client'

import { FiSearch } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { useState, FormEvent } from 'react'
// Style
import '@/src/styles/components/InputRelated/SearchInput.css'

export default function SearchInput() {
    const router = useRouter()
    const [query, setQuery] = useState('')

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        const trimmedQuery = query.trim()
        router.push(
            trimmedQuery
                ? `/search?q=${encodeURIComponent(trimmedQuery)}`
                : '/search'
        )
    }

    return (
        <form className='search-bar-modern' onSubmit={handleSubmit}>
            <FiSearch className='search-icon' />
            <input
                type='text'
                placeholder='Search for hotels, flights, activities...'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <button type='submit' className='search-btn-modern'>
                Search
            </button>
        </form>
    )
}
