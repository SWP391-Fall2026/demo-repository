import { useCallback, useEffect, useRef, useState } from "react";

export function useRemote(load, dependencies = []) {
    const fn = useRef(load);
    fn.current = load;
    const [data, setData] = useState();
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [version, setVersion] = useState(0);

    const hasDataRef = useRef(false);
    const nextModeRef = useRef("initial");
    const depsRef = useRef(dependencies);

    const depsChanged =
        depsRef.current.length !== dependencies.length ||
        depsRef.current.some((item, idx) => !Object.is(item, dependencies[idx]));
    if (depsChanged) {
        depsRef.current = dependencies;
        hasDataRef.current = false;
        nextModeRef.current = "initial";
    }

    const reload = useCallback(() => {
        nextModeRef.current = hasDataRef.current ? "refresh" : "initial";
        setVersion((n) => n + 1);
    }, []);

    const silentReload = useCallback(() => {
        nextModeRef.current = "silent";
        setVersion((n) => n + 1);
    }, []);

    useEffect(() => {
        let active = true;
        const mode = nextModeRef.current;
        nextModeRef.current = "initial";
        const isSilent = mode === "silent";
        const isInitial = mode === "initial" && !hasDataRef.current;

        if (isInitial) {
            setBusy(true);
            setError("");
        }
        else {
            setRefreshing(true);
            if (!isSilent) {
                setError("");
            }
        }

        fn.current()
            .then((v) => {
                if (active) {
                    hasDataRef.current = true;
                    setData(v);
                    setError("");
                }
            })
            .catch((e) => {
                if (active && !(isSilent && hasDataRef.current)) {
                    setError(e.message || "Không tải được dữ liệu");
                }
            })
            .finally(() => {
                if (active) {
                    setBusy(false);
                    setRefreshing(false);
                }
            });

        return () => {
            active = false;
        };
    }, [version, ...dependencies]);

    return { data, error, busy, refreshing, reload, silentReload };
}
