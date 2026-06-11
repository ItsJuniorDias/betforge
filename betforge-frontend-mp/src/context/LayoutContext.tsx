import { createContext, useContext, useState, useCallback } from "react";

const LayoutContext = createContext(null);

export function LayoutProvider({ children }) {
  const [slipOpen, setSlipOpen] = useState(true);
  const [isBettingPage, setIsBettingPage] = useState(false);

  const openSlip = useCallback(() => setSlipOpen(true), []);
  const closeSlip = useCallback(() => setSlipOpen(false), []);
  const toggleSlip = useCallback(() => setSlipOpen((v) => !v), []);
  const enterBet = useCallback(() => {
    setIsBettingPage(true);
    setSlipOpen(true);
  }, []);
  const exitBet = useCallback(() => {
    setIsBettingPage(false);
  }, []);

  return (
    <LayoutContext.Provider
      value={{
        slipOpen,
        openSlip,
        closeSlip,
        toggleSlip,
        isBettingPage,
        enterBet,
        exitBet,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

// Retorna fallback seguro se usado fora do provider (evita crash com null)
export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    // Provider ausente — retorna estado padrão inerte para não crashar
    return {
      slipOpen: true,
      openSlip: () => {},
      closeSlip: () => {},
      toggleSlip: () => {},
      isBettingPage: false,
      enterBet: () => {},
      exitBet: () => {},
    };
  }
  return ctx;
}
