import { useEffect, useState } from 'react';

interface State<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Runs a (possibly async) parser whenever the trimmed input changes, ignoring
// stale results. The parse function must be a stable reference (module-level).
export function useAsyncParse<T>(input: string, parse: (value: string) => Promise<T> | T): State<T> {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: false });

  useEffect(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      setState({ data: null, error: null, loading: false });
      return;
    }

    let active = true;
    setState((prev) => ({ ...prev, loading: true }));
    Promise.resolve()
      .then(() => parse(trimmed))
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch(
        (e) =>
          active &&
          setState({
            data: null,
            error: e instanceof Error ? e.message : 'Não foi possível processar a entrada',
            loading: false,
          }),
      );

    return () => {
      active = false;
    };
  }, [input, parse]);

  return state;
}
