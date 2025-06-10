# Home/Away Balance Principles

## Universal Rule

For all sports, home/away balance follows this principle:

- **Even number of games**: Perfect balance (e.g., 6 games = 3H/3A, 18 games = 9H/9A)
- **Odd number of games**: Offset by one (e.g., 5 games = 3H/2A or 2H/3A, 15 games = 8H/7A or 7H/8A)

## Sport-Specific Examples

### Even Game Counts
- **Gymnastics**: 6 games → 3H/3A (perfect balance)
- **Women's Basketball (conference)**: 18 games → 9H/9A
- **Football (conference)**: 8 games → 4H/4A

### Odd Game Counts  
- **Lacrosse**: 5 games → 3H/2A or 2H/3A (alternates yearly)
- **Baseball series**: 15 games → 8H/7A or 7H/8A
- **Soccer**: 15 games → 8H/7A or 7H/8A

## Year-to-Year Rotation

### Even Game Sports
- Same balance every year (e.g., always 3H/3A)
- **Venue rotation**: Same matchups flip home/away venues each year

### Odd Game Sports  
- **Pattern rotation**: Teams alternate between having extra home vs away
- **Venue rotation**: Same matchups flip home/away venues each year

## Implementation

```javascript
function calculateHomeAwayBalance(totalGames) {
  if (totalGames % 2 === 0) {
    // Even: perfect balance
    return {
      home: totalGames / 2,
      away: totalGames / 2,
      pattern: 'consistent'
    };
  } else {
    // Odd: offset by one, alternates yearly
    return {
      homeHeavy: { home: Math.ceil(totalGames / 2), away: Math.floor(totalGames / 2) },
      awayHeavy: { home: Math.floor(totalGames / 2), away: Math.ceil(totalGames / 2) },
      pattern: 'alternating'
    };
  }
}
```

## Examples by Sport

| Sport | Games | Pattern | Year 1 | Year 2 |
|-------|-------|---------|--------|--------|
| Gymnastics | 6 | Consistent | 3H/3A | 3H/3A |
| Lacrosse | 5 | Alternating | 3H/2A | 2H/3A |
| Basketball | 18 | Consistent | 9H/9A | 9H/9A |
| Football | 8 | Consistent | 4H/4A | 4H/4A |