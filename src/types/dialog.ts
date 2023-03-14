export interface DialogTextBlock {
    headline: string;
    text: string;
    position: number;
}

export interface WeekDayIntervalObject {
    start: number;
    end: number;
}

export interface IntervalItem {
    start: Date | number,
    end: Date | number
}

export interface SelectDialogItem {
    name: string,
    value: string | number | Record<string, any> | boolean,
    backgroundColor?: string,
    className?: string,
    url?: string,
    isSelected?: boolean,
    icon?: string
}

export interface DialogButtonOld {
    text: buttonText | string,
    buttonType: buttonType | number,
    collapseTime?: number,
    textColor?: string,
    backgroundColor?: string
}

declare enum buttonType {
    CANCEL = -1,
    NEGATIVE = 0,
    POSITIVE = 1
}

declare enum buttonText {
    CANCEL = 'Abbrechen',
    NO = 'Nein',
    OK = 'OK',
    YES = 'Ja'
}

