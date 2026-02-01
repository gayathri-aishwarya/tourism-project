import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: 'consent',
                    access_type: 'offline',
                    response_type: 'code',
                },
            },
        }),
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async jwt({ token, account, user }) {
            // Add access token & provider if available
            if (account) {
                token.accessToken = account.access_token
                token.provider = account.provider
            }
            if (user?.id) {
                token.sub = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub ?? null
            }
            session.accessToken = token.accessToken ?? null
            session.provider = token.provider ?? null
            return session
        },
    },
})

export { handler as GET, handler as POST }
