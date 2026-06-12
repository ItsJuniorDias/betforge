import { createContext, useContext, useState, useCallback } from 'react';

/**
 * BetSlipContext
 *
 * O campo `matchId` nos items é na verdade uma *betKey* composta:
 *   "{realMatchId}-{marketId}-{pick}"
 *
 * Isso permite que o mesmo jogo apareça múltiplas vezes no boletim
 * desde que seja em mercados ou picks diferentes (ex: 1x2 + over_under).
 *
 * Os campos opcionais _realMatchId, _marketId, _marketLabel são usados
 * para montar o payload real do POST /api/v1/bets.
 */

const BetSlipContext = createContext(null);

export function BetSlipProvider({ children }) {
  const [items, setItems] = useState([]);
  const [stake, setStake] = useState(50);
  const [betType, setBetType] = useState('single');

  const addBet = useCallback((bet) => {
    setItems(prev => {
      const existing = prev.find(i => i.matchId === bet.matchId);
      if (existing) {
        // Mesmo betKey: toggle (remove se já selecionado com mesmo pick)
        if (existing.pick === bet.pick) {
          return prev.filter(i => i.matchId !== bet.matchId);
        }
        // Mesmo betKey mas pick diferente: substitui
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
