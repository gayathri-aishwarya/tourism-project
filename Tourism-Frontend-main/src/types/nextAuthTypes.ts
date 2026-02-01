import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
    interface Session {
        user?: {
            id?: string | null
        } & DefaultSession['user']
        accessToken?: string | null
        provider?: string | null
    }

    interface User {
        id?: string | null
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        sub?: string | null
        accessToken?: string | null
        provider?: string | null
    }
}
