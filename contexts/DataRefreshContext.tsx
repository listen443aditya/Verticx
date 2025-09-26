import React, { createContext, useState, useContext, useCallback } from 'react';

interface DataRefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

const DataRefreshContext = createContext<DataRefreshContextType>({
  refreshKey: 0,
  triggerRefresh: () => console.warn('triggerRefresh called outside of provider'),
});

export const useDataRefresh = () => useContext(DataRefreshContext);

export const DataRefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey(prev => prev + 1), []);

  return (
    <DataRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </DataRefreshContext.Provider>
  );
};
