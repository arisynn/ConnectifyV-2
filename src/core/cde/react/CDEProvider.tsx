import React, { createContext, useContext, useEffect, useState } from 'react';
import { CDE } from '../CDE';
import { CDEState } from '../types/cde.types';

const CDEContext = createContext<CDEState | null>(null);

export const CDEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<CDEState>(CDE.getState());

  useEffect(() => {
    const unsubscribe = CDE.subscribe(() => {
      setState(CDE.getState());
    });

    return () => unsubscribe();
  }, []);

  return (
    <CDEContext.Provider value={state}>
      {children}
    </CDEContext.Provider>
  );
};

export const useCDEState = () => {
  const context = useContext(CDEContext);
  if (!context) {
    throw new Error('useCDEState must be used within a CDEProvider');
  }
  return context;
};
