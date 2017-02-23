import moment from 'moment'

export function momentToS(m) {
    return m.second() + m.minute() * 60 + m.hour() * 3600
}

export function sToMoment(s) {
    return moment().startOf('day').second(s)
}


