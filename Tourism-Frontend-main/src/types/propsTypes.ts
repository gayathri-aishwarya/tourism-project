import { PropsWithChildren } from 'react'
import {
    ActivityObject,
    BusObject,
    BusSeatsLayout,
    FlightObject,
    HotelObject,
    LocationObject,
    ReviewType,
} from '@/src/types/objectsTypes'

// ContainerRelated Props
export type ContainerProps = PropsWithChildren & {
    noPadding?: boolean
}

export type MainProps = PropsWithChildren & {
    noPadding?: boolean
    navFixed?: boolean
}

// AuthRelated Props
export type ModalsProps = {
    onCloseAction: () => void
}

// CardRelated Props
export type ActivityCardProps = {
    activity: ActivityObject
}

export type BusCardProps = {
    bus: BusObject
}

export type FlightCardProps = {
    flight: FlightObject
}

export type HotelCardProps = {
    hotel: HotelObject
}

export type ReviewCardProps = {
    review: ReviewType
}

export type LocationCardProps = {
    location: LocationObject
}

// Other Props
export type BusSeatsProps = {
    layout: BusSeatsLayout
    onSelect?: (seats: number[]) => void
    selectedSeats: number[]
}

// Dynamic Pages Props
export type LocationPageParamsType = {
    params: Promise<{
        id: string
    }>
}

export type FlightPageParamsType = {
    params: Promise<{
        id: string
    }>
}

export type BusPageParamsType = {
    params: Promise<{
        id: string
    }>
}

export type HotelPageParamsType = {
    params: Promise<{
        id: string
    }>
}

export type ActivityPageParamsType = {
    params: Promise<{
        id: string
    }>
}

export type BundlePageParamsType = {
    params: Promise<{
        id: string
    }>
}
