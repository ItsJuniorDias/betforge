import { createContext, useContext, useState, useCallback } from 'react';

const BetSlipContext = createContext(null);

export function BetSlipProvider({ children }) {
  const [items, setItems] = useState([]);
  const [stake, setStake] = useState(50);
  const [betType, setBetType] = useState('single');

  const addBet = useCallback((bet) => {
    setItems(prev => {
      const sameMatch = prev.find(i => i.matchId === bet.matchId);
      if (sameMatch) {
        if (sameMatch.pick === bet.pick) {
          return prev.filter(i => i.matchId !== bet.matchId);
        }
        return prev.map(i => i.matchId === bet.matchId ? bet : i);
      }
      return [...prev, bet];
    });
  }, []);

  const removeBet = useCallback((matchId) => {
    setItems(prev => prev.filter(i => i.matchId !== matchId));
  }, []);

  const clearSlip = useCallback(() => setItems([]), []);

  const isSelected = useCallback((matchId, pick) =>
    items.some(i => i.matchId === matchId && i.pick === pick), [items]);

  const totalOdd = items.reduce((acc, i) => acc * i.odd, 1);
  const multiplePayout = stake * totalOdd;
  const singlePayouts = items.map(i => ({ ...i, payout: stake * i.odd }));

  return (
    <BetSlipContext.Provider value={{
      items, stake, setStake, betType, setBetType,
      addBet, removeBet, clearSlip, isSelected,
      totalOdd, multiplePayout, singlePayouts,
      count: items.length,
    }}>
      {children}
    </BetSlipContext.Provider>
  );
}

export const useBetSlip = () => useContext(BetSlipContext);
