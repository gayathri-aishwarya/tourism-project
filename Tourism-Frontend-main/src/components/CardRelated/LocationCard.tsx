//src/components/CardRelated/LocationCard.tsx
import Link from 'next/link'
import Image from 'next/image'
// Functions
import { capitalizeWords } from '@/src/utils/Functions'
// Types
import { LocationCardProps } from '@/src/types/propsTypes'
// Style
import '@/src/styles/components/CardRelated/LocationCard.css'

export default function LocationCard({ location }: LocationCardProps) {
    return (
        <Link href={`/locations/${location._id}`} className='location-card'>
            {location.heroImage && (
    <Image
        width={200}
        height={200}
        src={location.heroImage}
        alt={location.name}
    />
)}

            <span className='location-name'>
                {capitalizeWords(location.name)}
            </span>
        </Link>
    )
}
