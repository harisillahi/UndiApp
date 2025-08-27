# Centralized Drawing Logic Restructure Plan

## Overview
Restructure the lottery application to centralize all drawing logic on the main page (control panel), with the drawing window serving only as a display mirror.

## Current Issues
1. Drawing logic is split between control panel and drawing window
2. Complex cross-window communication via localStorage
3. State synchronization problems
4. Inconsistent button states and animations

## New Architecture

### 1. Centralized Logic (Control Panel)
**All drawing calculations and state management happen on the main page:**
- Prize selection triggers winner slot creation
- Drawing animations run in the control panel
- Individual redraw logic centralized
- State management simplified

### 2. Display Window (Mirror Only)
**Drawing window becomes a pure display component:**
- Listens to main page state changes
- Displays current drawing state
- No logic, only visual representation
- Real-time synchronization via localStorage/events

### 3. Enhanced User Experience
**Improved workflow and button logic:**
- Prize selection → Winner slots appear
- MULAI UNDIAN → Switch to Winner Table + Start animations
- BERHENTI → Stop all animations + Set final numbers
- Individual UNDI ULANG → Redraw specific winner
- BERHENTI (during redraw) → Stop individual redraw

## Implementation Steps

### Step 1: Update LotteryContext
**Add new state properties:**
```typescript
interface LotteryState {
  // ... existing properties
  drawingNumbers: { [winnerId: string]: string }; // Current animated numbers
  isGlobalDrawing: boolean; // Main drawing active
  selectedPrizeIds: string[]; // Currently selected prizes for drawing
}
```

**Add new context methods:**
```typescript
interface LotteryContextType {
  // ... existing methods
  setDrawingNumbers: (numbers: { [winnerId: string]: string }) => void;
  setGlobalDrawing: (drawing: boolean) => void;
  setSelectedPrizeIds: (prizeIds: string[]) => void;
  startGlobalDrawing: (prizeIds: string[]) => void;
  stopGlobalDrawing: () => void;
  startIndividualRedraw: (winnerId: string) => void;
  stopIndividualRedraw: (winnerId: string, finalNumber: string) => void;
}
```

### Step 2: Restructure Control Panel
**Move all drawing logic to control panel:**
- Add drawing animation intervals
- Handle prize selection and winner creation
- Manage global and individual drawing states
- Implement centralized number generation

**New control panel features:**
- Real-time number animations in Winner Table
- Automatic view switching (Prize → Winner Table)
- Centralized button state management
- Proper error handling and user feedback

### Step 3: Update WinnerList Component
**Transform into animation-capable component:**
- Display animated numbers during drawing
- Show individual redraw animations
- Dynamic button states (UNDI ULANG ↔ BERHENTI)
- Visual feedback for active states

**Enhanced table features:**
```typescript
// Each winner row shows:
- Prize name
- Animated/static participant number
- Status badge (with animation states)
- Action buttons (context-aware)
```

### Step 4: Simplify Drawing Window
**Convert to pure display component:**
- Remove all drawing logic
- Listen to main page state via localStorage
- Display current state only
- Maintain visual appeal and animations

**Display window features:**
- Mirror main page drawing state
- Show animated numbers during drawing
- Highlight individual redraws
- Confetti effects for completed drawings

### Step 5: Enhanced State Synchronization
**Improved cross-window communication:**
```typescript
// Main page broadcasts state changes
localStorage.setItem('drawingState', JSON.stringify({
  drawingNumbers: state.drawingNumbers,
  isGlobalDrawing: state.isGlobalDrawing,
  currentRedrawWinnerId: state.currentRedrawWinnerId,
  winners: state.winners
}));

// Drawing window listens and updates display
window.addEventListener('storage', (e) => {
  if (e.key === 'drawingState') {
    updateDisplayFromState(JSON.parse(e.newValue));
  }
});
```

## Detailed Implementation

### Control Panel Changes
1. **Prize Selection Handler:**
   - Create winner slots immediately when prize selected
   - Add winners to state with empty participant numbers
   - Update selectedPrizeIds in context

2. **Global Drawing Logic:**
   - MULAI UNDIAN: Start intervals for all winners
   - Generate random numbers for all active winners
   - Update drawingNumbers state continuously
   - BERHENTI: Stop intervals, set final numbers

3. **Individual Redraw Logic:**
   - UNDI ULANG: Start interval for specific winner
   - Generate random numbers for that winner only
   - BERHENTI: Stop interval, set final number for that winner

### WinnerList Component Changes
1. **Dynamic Number Display:**
   ```typescript
   const displayNumber = state.isGlobalDrawing || state.currentRedrawWinnerId === winner.id
     ? state.drawingNumbers[winner.id] || '000'
     : winner.participantNumber || '---';
   ```

2. **Context-Aware Buttons:**
   ```typescript
   const isBeingRedrawn = state.currentRedrawWinnerId === winner.id;
   const showStopButton = isBeingRedrawn;
   const showConfirmButton = !winner.confirmed && winner.participantNumber && !isBeingRedrawn;
   const showRedrawButton = !isBeingRedrawn && !state.isGlobalDrawing;
   ```

3. **Animation States:**
   - Pulsing animation for numbers being drawn
   - Highlighted rows for active redraws
   - Disabled states during global drawing

### Drawing Window Changes
1. **State Listener:**
   ```typescript
   useEffect(() => {
     const handleStateUpdate = (e: StorageEvent) => {
       if (e.key === 'drawingState') {
         const newState = JSON.parse(e.newValue);
         setDisplayState(newState);
       }
     };
     
     window.addEventListener('storage', handleStateUpdate);
     return () => window.removeEventListener('storage', handleStateUpdate);
   }, []);
   ```

2. **Pure Display Logic:**
   - No intervals or drawing logic
   - Display numbers from received state
   - Show animations based on state flags
   - Trigger confetti on drawing completion

## Benefits of New Architecture

### 1. Simplified Logic
- All drawing logic in one place
- No complex cross-window communication
- Easier debugging and maintenance
- Consistent state management

### 2. Better User Experience
- Immediate visual feedback
- Proper button states
- Smooth animations
- Reliable synchronization

### 3. Improved Performance
- Reduced localStorage operations
- Fewer event listeners
- Optimized rendering
- Better memory management

### 4. Enhanced Reliability
- Single source of truth
- Consistent state across windows
- Proper error handling
- Graceful failure modes

## Testing Strategy

### 1. Unit Tests
- Context state management
- Drawing logic functions
- Number generation utilities
- Button state calculations

### 2. Integration Tests
- Prize selection → Winner creation
- Global drawing flow
- Individual redraw flow
- Cross-window synchronization

### 3. User Acceptance Tests
- Complete drawing workflow
- Individual redraw scenarios
- Error handling cases
- Performance under load

## Migration Plan

### Phase 1: Context Updates
- Update LotteryContext with new state
- Add new methods and properties
- Maintain backward compatibility

### Phase 2: Control Panel Logic
- Move drawing logic to control panel
- Implement centralized animations
- Update button handlers

### Phase 3: Component Updates
- Update WinnerList with animations
- Simplify drawing window
- Test cross-window communication

### Phase 4: Testing & Polish
- Comprehensive testing
- Performance optimization
- UI/UX improvements
- Documentation updates

This centralized architecture will provide a much more reliable, maintainable, and user-friendly lottery application.
