import {buttonText, buttonType, dialogAction} from './chaynsDialog';
import { isDate, isNumber, isObject } from './utils/is';
import {open} from './open';
import { DialogButtonOld, DialogTextBlock, IntervalItem, WeekDayIntervalObject } from "../../types/dialog";
import { getDevice } from "../index";

/**
 * The config object for date dialog
 * @typedef {Object} dateConfig
 * @property {Date} preSelect  - The date object which should be preselected.
 * @property {Date} minDate   - The min date which you could select.
 * @property {Date} maxDate  - The max date which you could select.
 * @property {dateDialogType} dateType  - The type of dialog you want to display.
 * @property {number} minuteIntervall - The interval for special minutes, possible are 2, 3, 4, 5, 6, 12, 15, 20, 30. Default is 1.
 * @property {string} message - The message that is displayed above the date dialog, only in apps supported
 * @property {string} title - The title that is displayed above the message, only in apps supported
 */

/**
 * This call will open a date select dialog.
 * <div>Call: 30</div>
 * @param {dateConfig} config - Define the configuration of this call
 * @return {Promise} contains a timestamp as result
 * @example chayns.dialog.date({
 *  'dateType': chayns.dialog.dateType.DATE_TIME,
 *  'preSelect': new Date(2018, 6, 14, 0, 0, 0),
 *  'minDate':  new Date(2018, 6, 1, 15, 0, 0),
 *  'maxDate': new Date(2019, 6, 1, 0, 23, 0),
 *  'minuteInterval': 15
 * ).then(function (data) {
 *  console.log(data);
 * });
 */

type DateConfig = {
    title?: string;
    message?: string;
    buttons?: DialogButtonOld[];
    minDate?: Date | number;
    maxDate?: Date | number;
    minuteInterval?: number;
    preSelect?: Date | undefined | number;
    multiselect?: boolean;
    disabledDates?: Date[] | number[];
    textBlocks?: DialogTextBlock[];
    yearSelect?: boolean;
    monthSelect?: boolean;
    interval?: boolean;
    minInterval?: number;
    maxInterval?: number;
    disabledIntervals?: Array<IntervalItem>;
    disabledWeekDayIntervals?: Array<WeekDayIntervalObject>[7];
    getLocalTime?: boolean;
    dateType?: number;
    autoSelectDate?: boolean
}

export function date(config: DateConfig = {}) {
    let {preSelect, minDate, maxDate, title, message, minuteInterval, autoSelectDate} = config,
        type = config.dateType || dateType.DATE;

    // This will fix the iOS problem with not preselectedDate without user interaction. That it return the wrog time.
    const { os, app } = getDevice();
    if (minuteInterval && minuteInterval > 1 && os === 'iOS' && app) {
        preSelect = roundInterval(preSelect, minuteInterval);
    } else {
        preSelect = validateValue(preSelect);
    }
    minDate = validateValue(minDate);
    maxDate = validateValue(maxDate);

    let buttons: {
        text: string,
        buttonType: number
    }[] = [];
    buttons = [{
        'text': buttonText.OK,
        'buttonType': buttonType.POSITIVE
    }];
    return open({
        'callType': dialogAction.DATE,
        type,
        'selectedDate': preSelect,
        minDate,
        maxDate,
        title,
        message,
        buttons,
        minuteInterval,
        autoSelectDate
    }).then((data) => {
        // @ts-ignore
        return Promise.resolve(data.selectedDate);
    });
}

type preSelectObj = {
    start?: number | undefined | Date,
    end?: number | undefined | Date
}

type preSelect = preSelectObj | Date | undefined | number | number[]

type AdvancedDateConfig = {
    title?: string;
    message?: string;
    buttons?: DialogButtonOld[];
    minDate?: Date | number;
    maxDate?: Date | number;
    minuteInterval?: number;
    preSelect?: preSelect;
    multiselect?: boolean;
    disabledDates?: Date[] | number[];
    textBlocks?: DialogTextBlock[];
    yearSelect?: boolean;
    monthSelect?: boolean;
    interval?: boolean;
    minInterval?: number;
    maxInterval?: number;
    disabledIntervals?: Array<IntervalItem>;
    disabledWeekDayIntervals?: Array<WeekDayIntervalObject>[7];
    getLocalTime?: boolean;
    dateType?: number;
    autoSelectDate?: boolean
}


export function advancedDate(config: AdvancedDateConfig = {}) {
    let {preSelect, minDate, maxDate, title, message, minuteInterval, buttons, multiselect, disabledDates, textBlocks, monthSelect, yearSelect, interval, maxInterval, minInterval, disabledIntervals, disabledWeekDayIntervals, getLocalTime, autoSelectDate} = config, // minInterval and maxInterval in minutes
        type = config.dateType || dateType.DATE;

    minDate = validateValue(minDate);
    maxDate = validateValue(maxDate);

    const { os, app } = getDevice();
    if(!preSelect) preSelect = {};
    if (Array.isArray(preSelect)) {
        preSelect = preSelect.map(p => validateValue(p)) as preSelect;
    } else if (isObject(preSelect)) {
        if((preSelect as preSelectObj).start && (preSelect as preSelectObj).end) {
            if (minuteInterval && minuteInterval > 1 && os === 'iOS' && app) {
                preSelect = [roundInterval((preSelect as preSelectObj).start, minuteInterval), roundInterval((preSelect as preSelectObj).end, minuteInterval)];
            } else {
                preSelect = [validateValue((preSelect as preSelectObj).start), validateValue((preSelect as preSelectObj).end)];
            }
        }
    } else {
        // This will fix the iOS problem with not preselectedDate without user interaction. That it return the wrong time.
        // eslint-disable-next-line no-lonely-if
        if (minuteInterval && minuteInterval > 1 && os === 'iOS' && app) {
            preSelect = roundInterval(preSelect as number, minuteInterval);
        } else {
            preSelect = validateValue(preSelect);
        }
    }

    if (Array.isArray(disabledDates)) {
        disabledDates = disabledDates.map(d => validateValue(d));
    }

    if (!buttons || !Array.isArray(buttons)) {
        buttons = [{
            'text': buttonText.OK,
            'buttonType': buttonType.POSITIVE
        }];
    }

    return open({
        'callType': dialogAction.ADVANCED_DATE,
        type,
        'selectedDate': Array.isArray(preSelect) ? undefined : preSelect,
        minDate,
        maxDate,
        title,
        message,
        minuteInterval,
        buttons,
        multiselect,
        'selectedDates': Array.isArray(preSelect) ? preSelect : undefined,
        disabledDates,
        textBlocks,
        monthSelect,
        yearSelect,
        interval,
        minInterval,
        maxInterval,
        disabledIntervals,
        disabledWeekDayIntervals,
        getLocalTime,
        autoSelectDate
    }).then((data) => {
        return Promise.resolve(data);
    });
}


/**
 * @typedef {number} dateDialogType
 */

/**
 * Enum for date dialog
 * <div>DATE will open a dialog where you can select a special day</div>
 * <div>TIME will open a dialog where you can only select a special time</div>
 * <div>DATE_TIME will open a dialog where you can select a special time on a special day</div>
 * @readonly
 * @enum {dateDialogType}
 * @type {{DATE: number, TIME: number, DATE_TIME: number}}
 */
export const dateType = {
    'DATE': 1,
    'TIME': 2,
    'DATE_TIME': 3
};

function validateValue(value) {
    if (!isNumber(value)) {
        if (isDate(value)) {
            // TODO: Find out whats the purpose of parsing to int
            return parseInt((value.getTime() / 1000) + "", 10);
        }
        return undefined;
    }
    return value;
}

function roundInterval(preDate: Date | undefined | number | number [] = new Date(), interval) {
    if (!isDate(preDate)) {
        if (isNumber(preDate)) {
            preDate = new Date(preDate as number);
        } else {
            return -1;
        }
    }
    let minutes = (preDate as Date).getMinutes();
    (preDate as Date).setMinutes(minutes - (minutes % interval));
    (preDate as Date).setSeconds(0);
    // TODO: Why?
    return parseInt(((preDate as Date).getTime() / 1000) + "", 10);
}
