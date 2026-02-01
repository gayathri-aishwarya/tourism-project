//src/contexts/Contexts.ts
'use client'

import { createContext } from 'react'
// Types
import {
    AdminContextType,
    AreAuthModalsOpenContextType,
    UserContextType,
} from '../types/contextsTypes'

export const AreAuthModalsOpenContext =
    createContext<AreAuthModalsOpenContextType>(
        {} as AreAuthModalsOpenContextType
    )

export const UserContext = createContext<UserContextType>({} as UserContextType)

export const AdminContext = createContext<AdminContextType>(
    {} as AdminContextType
)
