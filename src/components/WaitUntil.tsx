import {
    FC,
    ReactNode,
    useEffect,
    useState
} from "react";

export type TaskList = (TaskList | Promise<unknown> | (() => Promise<unknown>))[];

const handleTasks = async (tasks: TaskList) => {
    for(let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        if(Array.isArray(task)) {
            // eslint-disable-next-line no-await-in-loop
            await Promise.allSettled(task.map((t) => Array.isArray(t) ? handleTasks(t) : (typeof t === 'function' ? t() : t)));
        } else {
            // eslint-disable-next-line no-await-in-loop
            await (typeof task === 'function' ? task() : task).catch(() => {});
        }
    }
}

export const WaitUntil: FC<{tasks: TaskList, children?: ReactNode, loadingComponent?: ReactNode}> = ({ tasks, children, loadingComponent }) => {
    const [loaded, setLoaded] = useState(() => !tasks.length);

    useEffect(() => {
        handleTasks(tasks).finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return loaded ? children : loadingComponent;
}
