// Components
import Container from '@/src/components/ContainerRelated/Container'
// Types
import { MainProps } from '@/src/types/propsTypes'
// Style
import '@/src/styles/components/ContainerRelated/Main.css'

export default function Main({ children, noPadding, navFixed }: MainProps) {
    return (
        <main className={navFixed ? 'mt-(--nav-height)' : ''}>
            <Container noPadding={noPadding}>{children}</Container>
        </main>
    )
}
