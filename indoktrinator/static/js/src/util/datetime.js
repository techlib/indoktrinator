import {moment} from 'moment'

/**
 *
 * Format rrrr-mm-ddThh:mm:ss. On locale en-us for example 2013-02-08T09:30:26Z returns: February 8, 2013 10:30 AM.
 *
 * @inheritDoc http://momentjs.com/docs/#/displaying/format/
 *
 * @param val
 * @param locale
 *
 * @returns {string|*}
 */
export function datetimeToString(val, locale) {
  var m = moment(val)
  m.locale(locale)
  return m.format('LLL')
}

/**
 *
 * Format rrrr-mm-dd.

 * @param val
 *
 * @returns {string|*}
 */
export function dateToString(val) {
  return val
}

/**
 *
 * For 553535 seconds returns 53:45:35.
 *
 * @inheritDoc http://momentjs.com/docs/#/displaying/format/
 *
 * @param s
 *
 * @returns {string|*}
 */
export function secondsToString(s) {
  /*var d = moment(s, "seconds").format('hh:mm:ss')
  d.format('hh:mm:ss')
  return d;*/
  return moment.duration(s, 'seconds').format('m:ss', {trim: false})
}

/**
 * String as "Monday", "Sunday", .. to int
 *
 * @inheritDoc http://momentjs.com/docs/#/get-set/iso-weekday/
 *
 * @param val
 * @param locale
 *
 * @returns {int}
 */
export function stringDayToInt(val, locale) {
  var m = moment()
  m.locale(locale)
  m.day(val)
  return (m.format('e') - 1)
}

/**
 * Number as 0 - 6.. to "Monday", "Tuesday", ..
 *
 * @inheritDoc http://momentjs.com/docs/#/get-set/iso-weekday/
 *
 * @param val
 * @param locale
 *
 * @returns {string}
 */
export function intDayToString(val, locale) {
  var m = moment()
  m.locale(locale)
  m.weekday(val + 1)
  return m.format('dddd')
}

/**
 * Format: [Monday, Tuesday, Wednesday, Thursday, Friday]
 *
 * @param locale
 *
 * @returns {array}
 */
export function getWeekDays(locale) {
  var result = []
  for (var i=0; i<7; i++) {
    result.push(intDayToString(i, locale))
  }
  return result
}
