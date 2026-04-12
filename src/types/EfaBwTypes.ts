export interface StopEvent {
    transportation: {
        number: string
        destination: {
            name: string
        }
    }
    departureTimePlanned: string
    departureTimeEstimated?: string
    infos: Info[]
}

export interface Info {
    id: string
    infoLinks: {
        urlText: string
        content: string
    }[]
}