//src/contexts/Contexts.ts
'use client'

import { createContext } from 'react'
// Types
import {
   
    AreAuthModalsOpenContextType,
    UserContextType,
} from '../types/contextsTypes'

// src/types/contextsTypes.ts

export interface AdminContextType {
    // ... existing properties
    getBuses: () => Promise<any[]>; 
    // ... other admin functions
}

export const AreAuthModalsOpenContext =
    createContext<AreAuthModalsOpenContextType>(
        {} as AreAuthModalsOpenContextType
    )

export const UserContext = createContext<UserContextType>({} as UserContextType)

export const AdminContext = createContext<AdminContextType>(
    {} as AdminContextType
)
