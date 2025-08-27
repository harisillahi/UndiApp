# Individual Winner Redraw Implementation - Task Tracker

## Status: 🔄 IN PROGRESS

### ✅ Completed Tasks
- [x] Analyzed current React implementation
- [x] Compared with HTML version functionality
- [x] Created comprehensive implementation plan
- [x] Identified key requirement: "Berhenti" button in WinnerList table

### 🔄 Current Tasks

#### Step 1: Update Lottery Context (src/context/LotteryContext.tsx) ✅ COMPLETED
- [x] Add `currentRedrawWinnerId: string | null` to state
- [x] Add `slotIndex: number` property to Winner type
- [x] Update `addWinner` function to include slotIndex
- [x] Add `startRedraw(winnerId: string)` function
- [x] Add `stopRedraw()` function
- [x] Update `updateWinner` to preserve slotIndex

#### Step 2: Update Drawing Window (src/app/drawing-window/page.tsx) ✅ COMPLETED
- [x] Update `stopDrawing()` to assign slotIndex when calling `addWinner`
- [x] Simplify `handleIndividualRedraw()` to use `winner.slotIndex`
- [x] Update redraw to set `currentRedrawWinnerId` in context
- [x] Update `handleStopRedraw()` to clear redraw state
- [x] Enhance localStorage communication handling
- [x] Add better error handling and logging

#### Step 3: Update WinnerList Component (src/components/WinnerList.tsx) ✅ COMPLETED
- [x] Add redraw state display logic
- [x] Show "Berhenti" button when `state.currentRedrawWinnerId === winner.id`
- [x] Update `handleRedrawWinner()` to set redraw state
- [x] Add `handleStopRedraw()` function
- [x] Add visual indicators for winner being redrawn
- [x] Add row highlighting for active redraw

#### Step 4: Testing and Validation
- [x] Test individual winner redraw functionality - ISSUE FOUND: "Undi Ulang" buttons unclickable
- [x] Fix button state management issue - Reset redraw state on context load
- [x] Fix slotIndex calculation for existing winners - Calculate slotIndex if missing
- [x] Verify "Berhenti" button appears in correct table row
- [x] Test cross-window communication
- [ ] Final validation of complete redraw flow
- [ ] Validate UI/UX improvements

### 📋 Pending Tasks
- [ ] Documentation updates
- [ ] Final testing and bug fixes
- [ ] Performance optimization if needed

## Key Requirements
1. **"Berhenti" button in WinnerList table** - When a winner is being redrawn, show "Berhenti" button in that winner's row
2. **Reliable slot identification** - Use slotIndex property to accurately target winner's position in drawing grid
3. **Cross-window communication** - Maintain sync between control panel and drawing window
4. **Visual feedback** - Clear indicators showing which winner is being redrawn
5. **Error handling** - Graceful handling of edge cases and communication failures

## Implementation Notes
- Focus on making "Berhenti" button appear in WinnerList table, not drawing window
- Ensure reliable slot identification using slotIndex property
- Maintain modern UI/UX with Tailwind CSS
- Preserve existing functionality while adding individual redraw

## Next Action
Start with Step 1: Update Lottery Context to add redraw state management and slotIndex property.
