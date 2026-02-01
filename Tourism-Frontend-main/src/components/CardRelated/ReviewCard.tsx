// Functions
import { renderStars } from '@/src/utils/Functions'
// Types
import { ReviewCardProps } from '@/src/types/propsTypes'
// Style
import '@/src/styles/components/CardRelated/ReviewCard.css'

export default function ReviewCard({ review }: ReviewCardProps) {
    return (
        <div className='review-card'>
            <div className='review-header'>
                <span className='review-name'>{review.name}</span>
                <span className='review-stars'>
                    {renderStars(review.rating)}
                </span>
            </div>
            <p className='review-text'>{review.text}</p>
        </div>
    )
}
