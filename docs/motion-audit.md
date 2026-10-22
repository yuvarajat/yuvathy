# Motion audit — GSAP skill review

Reviewed on 23 October 2026 against the eight installed official GSAP skills.

## Outcome

The active site uses static HTML, CSS transitions, native details, and the Web Animations API. It has no GSAP runtime or component framework. Its existing button, menu, and FAQ effects are small enough for these browser APIs. The useful updates from this review are accessibility, navigation correctness, and reducing unnecessary visual work.

No GSAP runtime or plugin was added. Adding a timeline or scroll library for the current interactions would add JavaScript without resolving an unmet requirement. Reconsider a scoped GSAP timeline when there is a real product workflow to demonstrate.

## Findings and changes

| Priority | Reproduced finding | Change |
| --- | --- | --- |
| High | Focusing the service page's lower CTA scrolled it into view while its ancestor still had opacity `0`. In mobile Chrome emulation its top was 121px inside the viewport. The reveal then took 200ms to finish. | Removed the remaining 13 service-page reveal classes and their observer/CSS. Service text and controls are immediately visible for all input methods. |
| Medium | Scrolling from About back to the hero left “Who we are” marked as the current section. Sections without a matching navigation link never cleared the previous selection. | Determine the current section from the viewport, explicitly clear unmatched selections, and handle the document end. Apply the same reading-position logic to policy indexes while preserving dedicated-page markers. |
| Medium | After using the keyboard, moving the mouse over a button left input mode set to `keyboard`, making its arrow transition snap with a computed duration of `0s`. | Restore pointer mode on actual mouse movement. Avoid repeated input-attribute writes when the mode is unchanged. Keyboard actions remain immediate. |
| Low | The mobile navigation applied `backdrop-filter: blur(24px)` over the full viewport despite its 96% opaque background. | Remove the full-screen backdrop blur and use an opaque dark surface so page text cannot show through. Retain the existing short opacity transition. This removes a rendering effect; no device FPS improvement is claimed. |

Scroll updates use a passive listener and at most one queued animation-frame callback. Each callback reads section geometry before writing attributes, and writes only when the selected link changes. There is no continuous idle animation loop or per-frame layout-property animation.

## Coverage of all eight GSAP skills

| Skill | Application to this site |
| --- | --- |
| `gsap-core` | Reviewed property choices, interruption, responsive behavior, and reduced motion. Existing effects use transform/opacity and short timings; simple CSS transitions remain appropriate. |
| `gsap-scrolltrigger` | Reviewed reading position, reverse scrolling, jumps, viewport changes, and the document end. Fixed the active-navigation logic. Native scrolling stays in place; pinned or scrubbed sections have no current content requirement. |
| `gsap-plugins` | Reviewed the suitability of ScrollToPlugin, ScrollSmoother, Flip, SplitText, SVG, and gesture plugins. Current content has no complex scroll-to, layout-transition, split-text, or gesture requirement. |
| `gsap-performance` | Removed the full-screen backdrop blur and reveal work. Batched navigation reads/writes. Retained transform/opacity feedback and avoided blanket `will-change` promotion. |
| `gsap-timeline` | Reviewed sequencing. Current controls need a single transition, and FAQs use one opacity fade. There is no multi-step sequence that benefits from a timeline. |
| `gsap-utils` | Reviewed target scope and value mapping. All current targets are explicit DOM elements or page-local collections; no GSAP mapping, interpolation, or randomization utility is needed. |
| `gsap-react` | Reviewed applicability. There are no React components, hooks, hydration, or unmount lifecycles in the site. |
| `gsap-frameworks` | Reviewed applicability. There are no Vue, Svelte, Nuxt, or other component-framework lifecycles. |

## Validation

Headless system Chrome passed 16 check groups with no page JavaScript errors:

- All six pages load and fit 1440px and 390px viewports.
- Policy text is immediately visible.
- Keyboard menus open/close immediately; wrapped focus is visible and Escape restores focus.
- Pointer menus complete in 250ms and settle after rapid toggles.
- Resizing to desktop closes the mobile menu and restores usable focus.
- Mouse movement restores pointer transitions after keyboard use.
- Button presses complete in 160ms; careers and contact links retain opacity feedback.
- Both FAQ areas use a 150ms pointer fade; keyboard opening is immediate and closing cancels the fade.
- The service CTA is fully visible immediately on focus.
- Navigation handles forward/reverse scrolling, instant jumps, the hero, and the footer.
- Policy indexes follow the reading position and document end; Careers and service page markers are preserved.
- The mobile menu has no full-screen backdrop blur.
- Touch taps leave no sticky arrow transforms.
- Reduced-motion behavior remains accessible, including a live preference change.
- Content stays visible and native FAQs work without JavaScript.

These are browser-emulation checks. Physical-device frame-rate and GPU performance were not measured.
