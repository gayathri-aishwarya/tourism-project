import Link from 'next/link'
import Image from 'next/image'
// Types
import { ActivityCardProps } from '@/src/types/propsTypes'
// Style
import '@/src/styles/components/CardRelated/ActivityCard.css'

export default function ActivityCard({ activity }: ActivityCardProps) {
    // Destructure for readability
    const { details } = activity

    return (
        <Link
            href={`/activities/${activity._id}`}
            className={`activity-card ${!activity.is_active ? 'inactive' : ''}`}
        >
            <Image
                src={details.img}
                alt={activity.name}
                width={400}
                height={250}
                className='activity-card-img'
            />

            {!activity.is_active && (
                <div className='inactive-overlay'>Activity is inactive</div>
            )}

            <div className='activity-card-content'>
                <h3 className='activity-title'>{activity.name}</h3>
                <p className='activity-location'>{activity.description}</p>
                <div className='activity-footer'>
                    <span className='activity-duration'>
                        {details.duration_hours} hours
                    </span>
                    <span className='activity-price'>
                        <p>{details.price_per_person} EGP</p>
                    </span>
                </div>
            </div>
        </Link>
    )
}
