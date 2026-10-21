import { useCallback, useEffect, useRef, useState } from "react";
export function useRemote(load, dependencies = []) {
    const fn = useRef(load);
    fn.current = load;
    const [data, setData] = useState();
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(true);
    const [version, setVersion] = useState(0);
    const reload = useCallback(() => setVersion((n) => n + 1), []);
    useEffect(() => {
        let active = true;
        setBusy(true);
        setError("");
        fn.current()
            .then((v) => {
            if (active)
                setData(v);
        })
            .catch((e) => {
            if (active)
                setError(e.message || "Không tải được dữ liệu");
        })
            .finally(() => {
            if (active)
                setBusy(false);
        });
        return () => {
            active = false;
        };
    }, [version, ...dependencies]);
    return { data, error, busy, reload };
}
