import React, { createContext, useContext, useState, useEffect } from 'react';

interface WireframeContextType {
  wireframeMode: boolean;
  setWireframeMode: (v: boolean) => void;
}

const WireframeContext = createContext<WireframeContextType>({
  wireframeMode: false,
  setWireframeMode: () => {},
});

export const useWireframe = () => useContext(WireframeContext);

export const WireframeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wireframeMode, setWireframeMode] = useState(false);

  useEffect(() => {
    if (wireframeMode) {
      document.body.classList.add('wireframe');
    } else {
      document.body.classList.remove('wireframe');
    }
  }, [wireframeMode]);

  return (
    <WireframeContext.Provider value={{ wireframeMode, setWireframeMode }}>
        {children}
    </WireframeContext.Provider>
  );
};
