# Critical Issues Found in Demo Video

## Analysis Summary (Gemini 3 Flash)
Date: 2026-01-31
Latest Video: demo-videos/*.webm

---

## 🔴 CRITICAL ISSUES

### 1. Drones Are Invisible / Flying Away
**Problem**: Drones appear as tiny green dots, impossible to see
**Evidence**: All analyzed frames
**Root Cause**:
- Drones may be flying outside stadium bounds
- Size configuration not being applied
- Materials too dark/transparent

**Fix Needed**:
- ✅ Increased drone size in Config.js (0.3 → 0.8)
- ✅ Made drone body white/emissive in GeometryUtils.js
- ⏳ NEED TO VERIFY: Dev server restart to apply changes

---

### 2. Drone POV View Completely Broken
**Problem**: Frame 4 shows only blue void when switching to Drone POV
**Evidence**: Frame 4 - "blue void" with tiny green dot
**Root Cause**:
- Drone camera pointing wrong direction
- Camera attached to drone but not looking at field
- Possible null/undefined drone camera

**Fix Needed**:
- Check Drone.js line 66: `camera.lookAt(pos.x, pos.y - 2, pos.z)`
- Should look at ball position, not drone position
- Verify DroneCamera.js returns valid camera

---

### 3. Coverage Always 0.0%
**Problem**: Coverage metric shows 0% in ALL frames
**Evidence**: All frames show "Coverage: 0.0%"
**Root Cause**:
- CoverageHeatmap.isPointVisible() not working
- Camera matrices not updating before frustum check
- Drones might be outside field bounds (can't see voxels)

**Fix Applied**:
- Added `camera.updateMatrixWorld()` in CoverageHeatmap.js line 84
- ⏳ NEED TO TEST: Still not working

---

### 4. Performance Degradation (2-13 FPS)
**Problem**: FPS ranges from 2 to 13, making demo unusable
**Evidence**:
- Frame 2: 13 FPS
- Frame 5: 2 FPS (catastrophic)
**Root Cause**:
- Point cloud too dense (50k points)
- Shadow mapping enabled
- Too many scene traversals in DepthSensor

**Fixes Applied**:
- ✅ Disabled shadows in Config.js
- ✅ Reduced point cloud max from 100k → 50k
- ✅ Reduced update frequency 2 → 4 frames
- ✅ Added important object filtering in DepthSensor
- ⏳ NEED: Further optimization

---

### 5. Heatmap Rendering Glitch
**Problem**: Frame 6 shows "massive wall of translucent blue boxes"
**Evidence**: Frame 6 - entire screen filled with blue boxes
**Root Cause**:
- Heatmap voxels rendering over camera
- No depth testing or z-ordering
- Voxels too large/numerous

**Fix Needed**:
- Limit heatmap voxel count (currently 30×12×25 = 9000 voxels!)
- Add depth test: `material.depthTest = true`
- Reduce grid size to 15×6×12 = 1080 voxels

---

### 6. Bullet-Time Breaks Scene
**Problem**: Scene disappears when bullet-time activates
**Evidence**: Frames 4-6 from previous analysis
**Root Cause**:
- Bullet-time camera position invalid
- Scene not rendering with bullet-time camera

**Fix Applied**:
- ✅ Disabled bullet-time in recording script (Scene 3)
- Replaced with Drone POV showcase

---

### 7. View Switching Not Working
**Problem**: All frames stuck in "Free Camera" mode
**Evidence**: Gemini reports "all frames show Free Camera (1)"
**Root Cause**:
- Keyboard shortcuts not working in fullscreen mode
- UI button clicks not triggering view change

**Fix Applied**:
- ✅ Replaced keyboard presses with `page.evaluate()` button clicks
- ⏳ NEED TO VERIFY: Still not working in latest video

---

## 📋 ACTION ITEMS (Priority Order)

### Immediate (Must Fix for Demo)
1. **Fix Drone Visibility**
   - Restart dev server to apply size changes
   - Add debugging: console.log drone positions
   - Verify drones stay within field bounds

2. **Fix Drone POV Camera**
   - Update Drone.js camera.lookAt to point at ball
   - Test DroneCamera.getCamera() returns valid camera

3. **Fix Coverage Calculation**
   - Debug why frustum check always fails
   - Add console.log in isPointVisible()
   - Test with simple test case

4. **Reduce Heatmap Voxels**
   - Change grid size from 30×12×25 to 10×5×10
   - Add depthTest: true to voxel material
   - Only render when toggle is on

### Medium Priority
5. **Improve Performance**
   - Profile with Chrome DevTools
   - Reduce point cloud samples per drone
   - Disable heatmap during recording

6. **Test View Switching**
   - Add console.log when buttons clicked
   - Verify ViewManager.switchView() is called
   - Test in non-fullscreen mode first

### Low Priority
7. **Polish Drones**
   - Add spinning propeller animation
   - Add colored lights (red/green nav lights)
   - Add drone name labels

8. **Add Gemini Integration**
   - Connect actual Gemini API for narration
   - Use Pipecat for professional TTS

---

## 🧪 Testing Checklist

Before recording final demo:
- [ ] Drones visible as white objects with green LED rings
- [ ] Drones stay within ±50m of field center
- [ ] Coverage shows >0% (ideally 40-60%)
- [ ] FPS stays above 15 (preferably 20+)
- [ ] Drone POV shows field from drone's perspective
- [ ] Broadcast view shows sideline angle
- [ ] Point cloud visible as colored dots around players
- [ ] Heatmap toggle works without glitches
- [ ] All UI buttons work correctly

---

## 📊 Current Status

| Component | Status | Notes |
|-----------|--------|-------|
| Football Field | ✅ Working | Proper NFL markings |
| Players | ✅ Working | 22 players in formations |
| Ball Physics | ✅ Working | Realistic trajectories |
| Play Calling | ✅ Working | 8 different play types |
| Drones Deployed | ⚠️  Partial | Deploy works, but invisible |
| Drone Tracking | ❌ Broken | Flying away / out of bounds |
| Drone POV | ❌ Broken | Shows blue void |
| Point Cloud | ⚠️  Partial | Renders but too sparse |
| Coverage Heatmap | ❌ Broken | Always 0%, glitches |
| View Switching | ❌ Broken | Stuck in Free Camera |
| Performance | ❌ Critical | 2-13 FPS unacceptable |
| CMU Formation | ⏸️  Disabled | Caused flyaway issues |

---

## 💡 Recommended Approach

1. **Disable all broken features** for now:
   - ✅ Bullet-time (disabled)
   - ✅ CMU Formation Planner (disabled)
   - 🔲 Heatmap (should disable)
   - 🔲 Point cloud (should disable temporarily)

2. **Focus on core demo**:
   - Drones visible and tracking players
   - Drone POV working
   - Performance at 20+ FPS
   - View switching working

3. **Record simple demo**:
   - Broadcast view
   - Free camera showing drones
   - Drone POV from multiple drones
   - Basic stats overlay

4. **Add polish after core works**:
   - Re-enable point cloud (optimized)
   - Add coverage calculation (fixed)
   - Consider simpler heatmap (2D floor projection)

---

*Last Updated: 2026-01-31 12:30 PM*
