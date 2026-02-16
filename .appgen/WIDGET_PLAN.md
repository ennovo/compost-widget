# Widget Build Plan

## Widget Summary
- Name: EnnovoCompostWidget
- Folder: ennovo-compost-widget
- Description: Displays a composting facility diagram with real-time sensor overlays (temperature, moisture, oxygen) and an animated fan that spins when the fan is running.

## Data Flow

### Channels Read
| Channel | Hook | Data Fields | Purpose |
|---------|------|-------------|---------|
| ui_state | useAgentState(agentId) | temperature, moisture, oxygen, fan_running | Read real-time sensor data and fan status |

### Channels Written
(none - this is a read-only monitoring widget)

### Permissions Required
(none - read-only widget)

## Image Assets

Two image files must be embedded in the widget as base64 data URIs so they are self-contained in the single JS bundle:

1. **composter_diagram.png** (source: `/home/sid/Documents/ennovo compost widget/assets/composter_diagram.png`)
   - Used as the widget background image
   - Shows the full composting facility: blower unit on left, pipe, compost pile on right, all on a platform

2. **Inner fan.png** (source: `/home/sid/Documents/ennovo compost widget/assets/Inner fan.png`)
   - Circular fan blade image
   - Overlaid on the blower/fan area of the composter diagram (left side)
   - Rotates continuously via CSS animation when fan_running is true
   - Stops when fan_running is false

### Asset Embedding Strategy
Convert both images to base64 data URIs and embed as constants in the component file. This ensures the single-file JS output from ConcatenatePlugin contains everything needed. No separate asset files or URLs required.

## Visual Layout

The widget uses a relative-positioned container with the composter diagram as the background and sensor readings + fan image overlaid using absolute positioning.

### Component Tree
```
EnnovoCompostWidgetInner
  (no sub-components - single file, inline layout)
```

### Layout Description

1. **Container**: Relative position, sized to the background image aspect ratio. White/light background. The composter diagram fills the container.

2. **Background Image**: The composter_diagram.png displayed as an `<img>` element filling the container width, with natural aspect ratio preserved.

3. **Sensor Overlays**: Three labeled value displays positioned over the compost pile area (right/center of the diagram):
   - **Temperature**: Positioned near the top of the compost pile. Shows value with unit (e.g., "65.2 C"). Use a semi-transparent background pill/badge for readability.
   - **Oxygen**: Positioned in the middle area of the compost pile. Shows value with unit (e.g., "18.5 %"). Same badge style.
   - **Moisture**: Positioned near the lower area of the compost pile. Shows value with unit (e.g., "55.0 %"). Same badge style.

4. **Fan Image Overlay**: The Inner fan.png positioned precisely over the fan/blower circle on the left side of the diagram. Uses CSS `@keyframes` rotation animation that is active when `fan_running` is true and paused when false.

### Overlay Positioning (percentage-based for responsiveness)
All overlays use `position: absolute` with percentage-based `top` and `left` values relative to the container:

- **Fan overlay**: `top: 26%`, `left: 7%`, sized approximately 9% of container width (centered on the blower circle in the diagram)
- **Temperature badge**: `top: 18%`, `left: 55%` (upper area of compost pile)
- **Oxygen badge**: `top: 40%`, `left: 60%` (middle of compost pile)
- **Moisture badge**: `top: 55%`, `left: 50%` (lower area of compost pile)

Note: These positions may need fine-tuning during build. The key constraint is that readings appear over the compost pile and the fan appears over the blower circle.

### Badge Style
Each sensor reading badge:
- Semi-transparent dark background: `rgba(0, 0, 0, 0.65)`
- White text
- Rounded corners (border-radius: 8px)
- Padding for readability
- Small label text (e.g., "Temperature") above larger value text (e.g., "65.2 C")
- Min-width to prevent layout shift

### Fan Animation
```css
@keyframes ecw-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```
- Applied to the fan image element
- Duration: ~1.5s for a smooth, visible rotation speed
- `animation-play-state: running` when fan_running is true
- `animation-play-state: paused` when fan_running is false
- Linear timing function for constant speed

## Hooks Summary

### Layer 1 (RemoteComponentWrapper)
- Standard wrapper, provides Redux store + React Query context

### Layer 2 (Hooks Wrapper)
- `useRemoteParams()` -> `agentId`
- `useAgent(agentId)` -> loading guard

### Layer 3 (Inner Component)
- `useParams()` -> `agentId`
- `useAgentState(agentId)` -> `{ state }` (reads ui_state channel)
  - Access: `state?.children?.EnnovoCompostWidget?.children`
  - Within children, expect fields: `temperature`, `moisture`, `oxygen`, `fan_running`
  - Each field may be an object with a `value` property, or a direct value. Handle both.

## External Dependencies
(none needed - pure React with platform hooks and inline styles)

## Implementation Notes

1. **Three-layer pattern**: Follow the mandatory Layer 1 / Layer 2 / Layer 3 structure from widget-architecture.md
2. **useAgentState**: Use the `useAgentState(agentId)` shortcut hook to read ui_state, which returns `{ state }`
3. **Data path**: The ui_state structure for a RemoteComponent widget is typically at `state?.children?.[widgetName]?.children`. Sensor values may be nested as `{ type: "uiVariable", value: X }` objects or direct values. Use optional chaining and nullish coalescing throughout.
4. **Inline styles**: Use inline `style` prop for all positioning and animation since this is an image-overlay widget that doesn't benefit from Tailwind utility classes for the overlay positioning logic. Use Tailwind for the loading state and any text formatting.
5. **Image embedding**: Convert both PNG files to base64 data URIs at build time (embed as string constants in the JS file). This keeps the widget fully self-contained.
6. **CSS keyframes**: Inject via a `<style>` tag within the component (same pattern as the template). Prefix animation names with `ecw-` to avoid collisions.
7. **Responsive sizing**: The container should scale with available width. Use `width: 100%` on the background image and percentage-based positioning for all overlays.
8. **Loading state**: Show "Loading..." centered text while `state` is undefined.
9. **Null safety**: All data access uses optional chaining (`?.`) and nullish coalescing (`?? 'N/A'`).
