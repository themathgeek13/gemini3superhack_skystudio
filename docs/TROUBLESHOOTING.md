# Troubleshooting Guide

## Build & Server Issues

### "ESM integration proposal for Wasm" Error

**Symptom:** Red error overlay in browser about WASM not being supported

**Solution:** ✅ Already fixed!

The project includes `vite.config.js` with WASM support plugins:
- `vite-plugin-wasm`
- `vite-plugin-top-level-await`

These are automatically installed with `npm install`.

If you still see this error:
1. Delete `node_modules` folder
2. Run `npm install` again
3. Restart dev server with `npm run dev`

### Port Already in Use

**Symptom:** `Error: listen EADDRINUSE: address already in use :::5173`

**Solution:**
```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### Dependencies Not Installing

**Symptom:** `npm install` fails or shows errors

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete lock file and node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Vite Build Fails

**Symptom:** `npm run build` produces errors

**Solution:**
Check that all imports are correct:
```bash
# Run build to see specific errors
npm run build

# Common issues:
# - Missing file extensions in imports
# - Circular dependencies
# - Incorrect relative paths
```

## Runtime Errors

### Black Screen in Browser

**Possible Causes:**

1. **JavaScript Error**
   - Open DevTools (F12)
   - Check Console for errors
   - Common: WASM loading failure

2. **WebGL Not Supported**
   - Check: Visit https://get.webgl.org/
   - Try different browser (Chrome recommended)
   - Update graphics drivers

3. **Canvas Not Found**
   - Verify `index.html` has `<canvas id="canvas"></canvas>`
   - Check JavaScript console for DOM errors

**Solution:**
```javascript
// Add to src/main.js at the top to debug:
console.log('Starting application...');
console.log('Canvas:', document.getElementById('canvas'));
```

### Physics Not Working (Ball Not Bouncing)

**Symptom:** Ball is static or falls through floor

**Solution:**

1. Check console for "Physics initialized" message
2. Verify Rapier WASM loaded successfully
3. Try adjusting physics config:

```javascript
// In src/core/Config.js
PHYSICS: {
    gravity: { x: 0, y: -9.81, z: 0 },  // Increase if needed
    timestep: 1/60  // Reduce if unstable
}
```

### Drones Not Appearing

**Symptom:** No drones visible after pressing D

**Solutions:**

1. **Check checkbox:** "Show Drones" must be enabled
2. **Deploy manually:** Press D key or click "Deploy Drones" button
3. **Check stats:** Drone count should be > 0
4. **Camera position:** Zoom out or switch to broadcast view (2)

```javascript
// Debug in console:
console.log('Drone count:', app.droneFleet.getDroneCount());
console.log('Drones deployed:', app.droneFleet.isDeployed());
```

### Point Cloud Not Visible

**Symptom:** No colored points even with drones deployed

**Solutions:**

1. **Deploy drones first:** Point cloud requires active drones
2. **Check checkbox:** "Show Point Cloud" must be enabled
3. **Switch view:** Press 4 for dedicated point cloud view
4. **Wait a moment:** Point cloud updates every 2 frames
5. **Check stats:** Point count should show 50k-100k

```javascript
// Debug:
console.log('Point count:', app.pointCloudRenderer.getPointCount());
console.log('Visible:', app.pointCloudRenderer.visible);
```

### Low FPS / Performance Issues

**Symptom:** Stuttering, FPS < 30

**Quick Fixes:**

1. **Reduce Point Cloud Density**
```javascript
// In src/core/Config.js
POINTCLOUD: {
    maxPoints: 30000,  // Reduce from 100k
    updateFrequency: 4, // Update less often
}
```

2. **Fewer Drones**
```javascript
DRONE: {
    defaultCount: 3,   // Reduce from 5
}
```

3. **Disable Shadows**
```javascript
EFFECTS: {
    shadowsEnabled: false
}
```

4. **Lower Pixel Ratio**
```javascript
// In src/core/SceneManager.js
this.renderer.setPixelRatio(1);  // Instead of Math.min(devicePixelRatio, 2)
```

### Bullet-Time Not Working

**Symptom:** Pressing B does nothing

**Solutions:**

1. **Check time scale:** Already in bullet-time? Press B again to exit
2. **Verify controller:** Check console for errors
3. **Ball position:** Needs valid ball position to orbit

```javascript
// In browser console:
console.log('Bullet time active:', app.timeController.isBulletTime);
```

### Heatmap Not Appearing

**Symptom:** Pressing H shows nothing

**Solutions:**

1. **Deploy drones:** Heatmap needs active drones
2. **Wait for calculation:** First render may take a moment
3. **Check visibility:** Grid might be behind other objects
4. **Zoom out:** Try free camera (1) and zoom out

## Browser-Specific Issues

### Firefox

**Issue:** Lower performance than Chrome

**Solution:**
- Enable hardware acceleration in Firefox settings
- Use latest Firefox version (120+)
- Consider using Chrome for best performance

### Safari

**Issue:** WASM loading differently

**Solution:**
- Clear browser cache
- Use Safari Technology Preview for latest WebGL
- Or switch to Chrome/Firefox for development

### Mobile Browsers

**Issue:** Touch controls not working

**Solution:**
- Mobile is not officially supported (desktop-first)
- For testing: Use landscape mode, reduce quality settings
- Performance will be significantly lower

## Developer Tools Issues

### Source Maps Not Working

**Solution:**
```javascript
// Add to vite.config.js
export default defineConfig({
  build: {
    sourcemap: true
  }
})
```

### Hot Module Reload (HMR) Broken

**Solution:**
- Restart dev server
- Clear browser cache (Cmd/Ctrl + Shift + R)
- Check for syntax errors in recently edited files

## Console Errors Reference

### "Cannot read properties of null"

**Common Cause:** Trying to access element before it exists

**Solution:** Check initialization order in `main.js`

### "Three.js: Texture marked for update but image not loaded"

**Cause:** Loading texture that doesn't exist

**Solution:** Verify all texture paths, or remove texture loading code

### "Rapier not initialized"

**Cause:** Trying to create physics bodies before `await physicsManager.init()`

**Solution:** Ensure `init()` is called and awaited in App constructor

### "WebGL: CONTEXT_LOST_WEBGL"

**Cause:** GPU crashed or browser lost WebGL context

**Solution:**
- Refresh page
- Restart browser
- Update graphics drivers
- Reduce quality settings

## Performance Profiling

### Using Chrome DevTools

1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Interact with simulation
5. Stop recording
6. Look for:
   - Long tasks (> 16ms)
   - Excessive garbage collection
   - Layout thrashing

### Using Stats.js

Already integrated! Shows in top-left:
- FPS (frames per second)
- MS (milliseconds per frame)

Target: 60 FPS (16ms per frame)
Minimum: 30 FPS (33ms per frame)

### Finding Bottlenecks

```javascript
// Add timing logs in src/main.js animate():

const startTime = performance.now();

// ... your code ...

console.log('Update time:', performance.now() - startTime, 'ms');
```

Common bottlenecks:
1. Point cloud updates (most expensive)
2. Physics simulation
3. Drone AI calculations
4. Rendering (if too many objects)

## Getting More Help

### Check Documentation
- `README.md` - Overview and features
- `QUICKSTART.md` - Quick start guide
- `VERIFICATION.md` - Testing checklist
- `GEMINI_INTEGRATION.md` - AI features

### Debug Mode

Add to top of `src/main.js`:
```javascript
window.DEBUG = true;

// Then throughout code:
if (window.DEBUG) {
    console.log('Debug info:', someVariable);
}
```

### Common Config Tweaks

All in `src/core/Config.js`:

**Performance:**
- Reduce `POINTCLOUD.maxPoints`
- Increase `POINTCLOUD.updateFrequency`
- Reduce `DRONE.defaultCount`
- Disable `EFFECTS.shadowsEnabled`

**Visual Quality:**
- Increase `POINTCLOUD.pointSize`
- Adjust `BALL.restitution` (bounciness)
- Change `DRONE.repulsionForce` (spacing)
- Modify `TIME.bulletTimeScale` (slow-mo speed)

**Behavior:**
- Adjust `DRONE.ballAttractionForce`
- Change `DRONE.minHeight` / `maxHeight`
- Modify `PLAYER.speed`

### Still Having Issues?

1. **Clear everything and start fresh:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

2. **Check browser console** for specific error messages

3. **Verify system requirements:**
   - Modern browser (Chrome 120+, Firefox 120+)
   - WebGL 2.0 support
   - JavaScript enabled
   - Decent GPU (integrated graphics OK for lower settings)

4. **Try the fallback:**
If physics is the issue, you can simplify by removing Rapier:
- Comment out physics code in ball/drone updates
- Use simple `position += velocity` instead
- Still looks good without full physics

Good luck! 🚀
