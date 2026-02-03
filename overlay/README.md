# GiveBit Stream Overlays

Professional stream overlays for OBS, Streamlabs, and other streaming software.

## Available Overlays

### 1. Standard Alert (`index.html`)
Full-featured donation alerts with animations and customization.

**Features:**
- Slide-in animations
- Donor name and amount display
- Custom messages
- Auto-dismiss after 5 seconds
- Connection status indicator

**URL Format:**
```
file:///path/to/overlay/index.html?projectId=proj_xxx&apiKey=gb_test_xxx&mode=testnet
```

**Optional Parameters:**
- `showStatus=true` - Show connection status indicator
- `test=true` - Show all donation events (pending/confirmed/finalized)

### 2. Minimal Alert (`minimal.html`)
Clean, center-screen donation popup.

**Features:**
- Center-screen display
- Large, bold text
- Pop-in/pop-out animation
- Perfect for fullscreen alerts

**URL Format:**
```
file:///path/to/overlay/minimal.html?projectId=proj_xxx&apiKey=gb_test_xxx
```

### 3. Donation Ticker (`ticker.html`)
Scrolling banner showing recent donations.

**Features:**
- Bottom-screen ticker
- Shows last 20 donations
- Continuous scrolling animation
- Auto-updates with new donations

**URL Format:**
```
file:///path/to/overlay/ticker.html?projectId=proj_xxx&apiKey=gb_test_xxx&limit=20
```

**Optional Parameters:**
- `limit=20` - Number of donations to display (default: 20)

### 4. Donation Goal (`goal.html`)
Progress bar for donation goals.

**Features:**
- Real-time progress tracking
- Percentage display
- Current/target amounts
- Changes color when goal reached

**URL Format:**
```
file:///path/to/overlay/goal.html?projectId=proj_xxx&apiKey=gb_test_xxx&goal=5.0
```

**Required Parameters:**
- `goal=5.0` - Target amount in ETH

## Setup Instructions

### OBS Studio

1. **Add Browser Source**
   - Click the `+` icon in Sources
   - Select "Browser"
   - Name it (e.g., "GiveBit Donations")

2. **Configure Source**
   - **Local file:** Check this box
   - **Local file path:** Browse to the overlay HTML file
   - **Width:** 1920 (for alerts) or 400 (for goal widget)
   - **Height:** 1080 (for alerts) or 150 (for goal widget)
   - **Custom CSS:** Leave empty
   - **Shutdown source when not visible:** Unchecked
   - **Refresh browser when scene becomes active:** Unchecked

3. **Add URL Parameters**
   
   In the **Custom browser source settings**, add to the URL:
   ```
   ?projectId=proj_xxx&apiKey=gb_test_xxx&mode=testnet
   ```

4. **Position & Size**
   - Right-click the source → Transform → Edit Transform
   - Adjust position and scale as needed

### Streamlabs OBS

1. **Add Browser Source**
   - Click `+` in Sources
   - Select "Browser Source"

2. **Settings**
   - **URL:** Full path to HTML file with parameters
   - **Width/Height:** Set appropriate dimensions
   - **CSS:** Leave empty

3. **Apply and position on canvas**

### XSplit

1. **Add Source**
   - Add → Webpage
   - Enter the file path with parameters

2. **Configure**
   - Set dimensions
   - Position on scene

## Customization

### Changing Colors

Edit the CSS in each HTML file:

```css
/* Standard Alert - Change gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Change gold color */
color: #ffd700; /* Replace with your color */
```

### Changing Animation Duration

```css
/* In @keyframes or animation property */
animation: slideIn 0.5s ease-out forwards;
/*                   ^^^^ Change this */
```

### Changing Alert Display Time

```javascript
// In JavaScript section
setTimeout(() => {
  alert.remove();
}, 5000); // Change 5000 (5 seconds) to your preference
```

## Testing

### Local Testing

1. Open HTML file in browser
2. Add parameters to URL:
   ```
   file:///C:/path/to/overlay/index.html?projectId=proj_test&apiKey=gb_test_xxx&test=true
   ```
3. The `test=true` parameter shows all donation events

### Test Donation

Create a test donation:

```bash
curl -X POST https://testnet.zidanmutaqin.dev/api/setup \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Test Stream",
    "creatorWallet": "0xYourWallet"
  }'
```

Use the returned credentials in your overlay.

## Troubleshooting

### Overlay Not Showing

1. **Check Browser Console** (F12 in OBS Browser Source)
   - Right-click source → Interact
   - Press F12 to open console
   - Look for errors

2. **Verify Parameters**
   - Ensure `projectId` and `apiKey` are correct
   - Check for typos in URL

3. **Check Connection**
   - Add `showStatus=true` to URL
   - Green = Connected, Red = Error

### Donations Not Appearing

1. **Test Connection**
   ```javascript
   // In browser console
   console.log(givebit.isConnected()); // Should return true
   ```

2. **Check Network**
   - Ensure internet connection is stable
   - Check firewall/antivirus settings

3. **Verify Webhook**
   - Donations must be finalized on blockchain
   - Check explorer: https://eth-holesky.blockscout.com/

### Performance Issues

1. **Reduce Animation Complexity**
   - Simplify CSS animations
   - Lower frame rate in OBS settings

2. **Limit Ticker Items**
   - Reduce `limit` parameter
   - Clear old donations periodically

## Advanced Configuration

### Custom Sounds

Add sound to `index.html`:

```javascript
function playDonationSound() {
  const audio = new Audio('https://your-domain.com/sound.mp3');
  audio.volume = 0.5;
  audio.play();
}
```

### Multiple Alerts

Stack multiple browser sources for layered effects:
1. Background effects
2. Main alert
3. Ticker overlay

### Custom Styling

Create your own theme by modifying:
- Colors (`background`, `color`)
- Fonts (`font-family`)
- Animations (`@keyframes`)
- Layout (`position`, `display`)

## Support

- Issues: [GitHub Issues](https://github.com/zidanaetrna/givebit-sdk/issues)
- Email: me@zidanmutaqin.dev

## License

Apache License 2.0 - Same as GiveBit SDK
