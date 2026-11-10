import { addAppleSafeAreaListener, AppleSafeArea, getSafeArea, HingeStatus, useSafeArea, useSafeAreaListener } from '../dist/types';

const ordinaryPhone: AppleSafeArea = { top: 12, left: 17, bottom: 20, right: 43 };
const duo: AppleSafeArea = { ...ordinaryPhone, hingeAngle: 0, hingeStatus: HingeStatus.Closed };

declare const hookValue: ReturnType<typeof useSafeArea>;
const hingeAngle: number | undefined = hookValue.hingeAngle;
const hingeStatus: HingeStatus | undefined = hookValue.hingeStatus;

const getInsets: () => Promise<AppleSafeArea> = getSafeArea;
const addListener: (callback: (value: AppleSafeArea) => void) => Promise<number> = addAppleSafeAreaListener;
const useListener: () => (callback: (value: AppleSafeArea) => void) => () => void = useSafeAreaListener;
