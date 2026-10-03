import { useCallback, useEffect, useRef, useState } from 'react';
import { container } from '../../di/container';
import type { CommentsPage, SortField, SortOrder } from '../../domain/entities/Comment';

export function useComments() {
  const [data, setData] = useState<CommentsPage | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [order, setOrder] = useState<SortOrder>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const requestId = useRef(0);
  const everConnected = useRef(false);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const result = await container.getComments.execute({ page, sortBy, order });
      if (id === requestId.current) {
        setData(result);
        setError(null);
      }
    } catch {
      if (id === requestId.current) setError('Не удалось загрузить комментарии');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [page, sortBy, order]);

  useEffect(() => {
    load();
  }, [load]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    let timer: number | undefined;
    const unsubscribe = container.subscribeToUpdates.execute(
      () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => loadRef.current(), 300);
      },
      (isConnected) => {
        setConnected(isConnected);
        if (isConnected && everConnected.current) loadRef.current();
        if (isConnected) everConnected.current = true;
      },
    );
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const toggleSort = (field: SortField) => {
    setPage(1);
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  return { data, page, setPage, sortBy, order, toggleSort, loading, error, connected, reload: load };
}