// Types
import { ContainerProps } from '@/src/types/propsTypes'
// Style
import '@/src/styles/components/ContainerRelated/Container.css'

export default function Container({ children, noPadding }: ContainerProps) {
    return (
        <div className={`container ${noPadding ? 'no-padding' : ''}`}>
            {children}
        </div>
    )
}
