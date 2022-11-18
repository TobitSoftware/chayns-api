import throttle from 'lodash.throttle';

export const setTappHeight = (setHeight: (height: number) => Promise<void>) => {
    document.documentElement.style.overflow = 'hidden';
    void setHeight(document.body.offsetHeight);

    let oldHeight = 0;
    const handleResize = () => {
        const { offsetHeight } = document.body;
        if (oldHeight !== offsetHeight) {
            void setHeight(offsetHeight);
            oldHeight = offsetHeight;
        }
    }

    if (window.ResizeObserver) {
        const interval = setInterval(handleResize, 200)
        let firstResize = true;
        const resizeObserver = new window.ResizeObserver(throttle(() => {
            handleResize();
            if(!firstResize) {
                clearInterval(interval);
            }
            firstResize = false;
        }, 16));
        resizeObserver.observe(document.body);

        setTimeout(() => {
            clearInterval(interval);
        }, 2000)
    } else {
        setInterval(handleResize, 200)
    }
}
