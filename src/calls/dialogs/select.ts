import {buttonText, buttonType, dialogAction} from './chaynsDialog';
import {open} from './open';
import { isPresent } from "./utils/is";
import { SelectInput } from '../../types/IChaynsReact'
import { SelectDialogItem } from "../../types/dialog";

export function select(config: SelectInput) {
    const list: Array<SelectDialogItem> = [];

    for (let i = 0, l = config.list.length; i < l; i++) {
        const item = config.list[i];
        list.push({
            name: item.name,
            'value': isPresent(item.value) ? item.value : item.name,
            'isSelected': !!item.isSelected,
            'icon': item.icon,
            'backgroundColor': item.backgroundColor,
            'className': item.className,
            'url': item.url
        });
    }

    if (config.list.length === 0) {
        return Promise.reject(new Error('Invalid Parameters'));
    }

    if (!config.buttons || !Array.isArray(config.buttons)) {
        config.buttons = [{
            'text': buttonText.OK,
            'buttonType': buttonType.POSITIVE
        }, {
            'text': buttonText.CANCEL,
            'buttonType': buttonType.CANCEL
        }];
    }

    return open({
        'callType': dialogAction.SELECT,
        'title': config.title || '',
        'message': config.message || '',
        'buttons': config.buttons,
        'links': config.links,
        'multiselect': !!config.multiselect,
        'quickfind': !!config.quickfind,
        'type': config.type,
        'preventCloseOnClick': !!config.preventCloseOnClick,
        'selectAllButton': config.selectAllButton,
        list
    });
}

export const selectType = {
    'DEFAULT': 0,
    'ICON': 1
};
