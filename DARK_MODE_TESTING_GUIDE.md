# Dark Mode Testing Guide

## Quick Start
1. Start the development server: `npm run dev`
2. Open the app in your browser
3. Navigate to **Settings → Quick Settings**
4. Click the **Theme** toggle button (Sun/Moon icon)
5. The entire app should instantly switch to dark mode

## Theme Toggle Testing

### ✅ Basic Functionality
- [ ] Theme toggle button appears in Settings → Quick Settings
- [ ] Button shows **Sun icon** in light mode
- [ ] Button shows **Moon icon** in dark mode
- [ ] Clicking toggles between light and dark instantly
- [ ] No page refresh required
- [ ] Smooth transition between themes

### ✅ Persistence
- [ ] Theme choice persists after page reload
- [ ] Theme syncs across multiple browser tabs
- [ ] Theme persists after closing and reopening browser
- [ ] System preference is respected on first visit

### ✅ System Integration
- [ ] App respects OS dark mode setting initially
- [ ] User choice overrides system preference
- [ ] Changing OS theme while app is open doesn't override user choice

## Language Selection Testing

### ✅ Indian Languages Display
- [ ] Open Settings → Quick Settings
- [ ] Click "Edit" next to Language
- [ ] Verify all 17 languages appear:
  * English
  * हिंदी (Hindi)
  * বাংলা (Bengali)
  * తెలుగు (Telugu)
  * தமிழ் (Tamil)
  * मराठी (Marathi)
  * ગુજરાતી (Gujarati)
  * ಕನ್ನಡ (Kannada)
  * മലയാളം (Malayalam)
  * ଓଡ଼ିଆ (Odia)
  * ਪੰਜਾਬੀ (Punjabi)
  * অসমীয়া (Assamese)
  * اردو (Urdu)
  * Español (Spanish)
  * Français (French)
  * Deutsch (German)
  * 日本語 (Japanese)

### ✅ Language Selection
- [ ] Unicode characters display correctly (no boxes/question marks)
- [ ] Selected language appears after clicking "Save"
- [ ] Language selection persists after page reload
- [ ] Language dropdown is readable in dark mode

## Dark Mode Visual Testing

### 🎨 Color Scheme
**Background Colors:**
- [ ] Main background: Dark slate blue (#0f172a)
- [ ] Card background: Lighter slate (#1e293b)
- [ ] No pure black backgrounds (unless intentional)
- [ ] Smooth color gradations

**Text Colors:**
- [ ] Body text: Light gray/white (#f1f5f9)
- [ ] Headings: White or very light colors
- [ ] Muted text: Medium gray (#94a3b8)
- [ ] No black text on dark backgrounds

**Accent Colors:**
- [ ] Primary blue: Bright and visible (#3b82f6)
- [ ] Success green: Clearly visible
- [ ] Error red: High contrast (#ef4444)
- [ ] Warning yellow: Readable

### 📱 Component-by-Component Testing

#### Dashboard (Main Feed)
- [ ] Post cards have good contrast
- [ ] Story circles are visible
- [ ] User names are readable
- [ ] Timestamps are visible but muted
- [ ] Like/comment icons are clear
- [ ] Images load and display properly

#### Navigation
- [ ] Top navigation bar has proper background
- [ ] Navigation icons are visible
- [ ] Active tab is clearly indicated
- [ ] Hover states work properly
- [ ] Text labels are readable

#### Settings Page
- [ ] All section headers are readable
- [ ] Card backgrounds contrast with page background
- [ ] Icons are visible
- [ ] Switches have clear on/off states
- [ ] Input fields have proper borders
- [ ] Buttons are clearly visible
- [ ] Badge colors work in dark mode

#### Forms (Login/Register)
- [ ] Input fields have visible borders
- [ ] Placeholder text is readable but muted
- [ ] Labels are clear
- [ ] Error messages are visible (red with good contrast)
- [ ] Success messages are visible (green)
- [ ] Focus states show clearly

#### Google Maps Integration
- [ ] Map container has proper background
- [ ] Error messages are visible
- [ ] Loading states are clear
- [ ] Map controls are visible
- [ ] Markers stand out

#### Modals/Dialogs
- [ ] Modal overlay dims the background appropriately
- [ ] Modal content has proper contrast
- [ ] Close buttons are visible
- [ ] Text is readable
- [ ] Buttons are clearly visible

#### Random Chat
- [ ] Chat messages have good contrast
- [ ] User avatars are visible
- [ ] Timestamp text is readable
- [ ] Input field is clearly visible
- [ ] Send button stands out

### 🔍 Contrast Ratio Testing
Use browser DevTools or online tools to verify:
- [ ] Body text: Minimum 7:1 contrast ratio (AAA standard)
- [ ] Headings: Minimum 7:1 contrast ratio
- [ ] Large text (18pt+): Minimum 4.5:1 contrast ratio
- [ ] UI components: Minimum 3:1 contrast ratio
- [ ] Icons: Minimum 3:1 contrast ratio

### ⚠️ Common Issues to Check

**Text Visibility:**
- [ ] No white text on light backgrounds
- [ ] No black text on dark backgrounds
- [ ] No gray-on-gray that's hard to read
- [ ] Sufficient contrast for people with vision impairments

**Border Visibility:**
- [ ] Input fields have visible borders
- [ ] Card edges are distinguishable
- [ ] Dividers between sections are visible
- [ ] No "floating" elements due to invisible borders

**Interactive Elements:**
- [ ] Buttons look clickable (not flat/invisible)
- [ ] Hover states change appearance
- [ ] Disabled states are clearly different
- [ ] Focus indicators are visible

**Images and Media:**
- [ ] Profile pictures have borders/shadows if needed
- [ ] Images don't blend into dark background
- [ ] Video player controls are visible
- [ ] Loading skeletons are visible

## Browser Testing

Test in multiple browsers:
- [ ] **Chrome/Edge** (Chromium)
- [ ] **Firefox**
- [ ] **Safari** (if on Mac)
- [ ] **Mobile browsers** (Chrome/Safari on phone)

## Accessibility Testing

### Screen Reader Compatibility
- [ ] Theme toggle has proper aria-label
- [ ] Color isn't the only indicator (icons + text)
- [ ] All interactive elements are keyboard accessible

### Keyboard Navigation
- [ ] Can toggle theme with keyboard (Tab + Enter)
- [ ] Focus indicators visible in dark mode
- [ ] Tab order makes sense
- [ ] All modals are keyboard accessible

### Reduced Motion
- [ ] Respects `prefers-reduced-motion` setting
- [ ] Theme transitions are smooth but not excessive
- [ ] No jarring animations

## Performance Testing

- [ ] Theme switching is instant (<100ms perceived)
- [ ] No flash of wrong theme on page load
- [ ] No layout shift when switching themes
- [ ] CSS variables update efficiently

## Edge Cases

### Mixed Content
- [ ] User-generated content (posts) readable in dark mode
- [ ] External images don't break layout
- [ ] Embedded content has proper borders/backgrounds

### Loading States
- [ ] Skeleton loaders are visible
- [ ] Loading spinners have good contrast
- [ ] "Loading..." text is readable

### Error States
- [ ] 404 page works in dark mode
- [ ] Error boundaries are readable
- [ ] Network error messages are visible

### Empty States
- [ ] "No posts yet" messages are visible
- [ ] Empty search results are clear
- [ ] Placeholder content is readable

## Mobile Responsiveness

- [ ] Dark mode works on mobile devices
- [ ] Touch targets are visible in dark mode
- [ ] Bottom navigation (if any) has proper contrast
- [ ] Pull-to-refresh indicator is visible
- [ ] Status bar color matches dark theme

## Reporting Issues

If you find any dark mode issues:

1. **Take a screenshot** showing the problem
2. **Note the component/page** where it occurs
3. **Describe the issue:**
   - What's wrong? (e.g., "text not visible")
   - Expected appearance
   - Actual appearance
4. **Browser and OS:** Include version numbers
5. **Steps to reproduce**

### Example Issue Report:
```
Component: Dashboard Post Card
Issue: Comment count text is too dark (#64748b on #1e293b)
Expected: Light gray text clearly visible
Browser: Chrome 120 on Windows 11
Steps: 1. Enable dark mode 2. View dashboard 3. Look at post comments
```

## Color Palette Reference

### Light Mode
- Background: #ffffff (white)
- Foreground: #0f172a (dark slate)
- Card: #ffffff (white)
- Border: #e2e8f0 (light gray)
- Primary: #2563eb (blue)
- Destructive: #ef4444 (red)

### Dark Mode
- Background: #0f172a (dark slate)
- Foreground: #f1f5f9 (light gray)
- Card: #1e293b (slate)
- Border: #334155 (medium slate)
- Primary: #3b82f6 (bright blue)
- Destructive: #ef4444 (red - same as light)

## Automated Testing (Optional)

If you want to add automated tests:

```javascript
// Example test
describe('Dark Mode', () => {
  it('should toggle theme', () => {
    cy.visit('/settings')
    cy.get('[aria-label*="theme"]').click()
    cy.get('html').should('have.class', 'dark')
  })
  
  it('should persist theme choice', () => {
    cy.visit('/settings')
    cy.get('[aria-label*="theme"]').click()
    cy.reload()
    cy.get('html').should('have.class', 'dark')
  })
})
```

## Sign-Off Checklist

Before considering dark mode complete:
- [ ] All pages tested in dark mode
- [ ] No console errors related to theming
- [ ] Theme toggle works consistently
- [ ] Contrast ratios meet WCAG AAA standards
- [ ] Documentation updated
- [ ] Screenshots taken for reference
- [ ] Team members have tested and approved

## Quick Fixes for Common Issues

### Text Not Visible
```tsx
// Add dark mode class
<p className="text-gray-900 dark:text-gray-100">
  Your text here
</p>
```

### Background Blend Issue
```tsx
// Add contrasting background
<div className="bg-white dark:bg-gray-800">
  Your content
</div>
```

### Border Not Visible
```tsx
// Add dark mode border
<div className="border border-gray-200 dark:border-gray-700">
  Your content
</div>
```

### Input Field Issues
```tsx
// Complete input styling
<input 
  className="
    bg-white dark:bg-gray-800 
    text-gray-900 dark:text-gray-100
    border-gray-300 dark:border-gray-600
    focus:border-blue-500 dark:focus:border-blue-400
  "
/>
```

## Resources

- **Tailwind CSS Dark Mode Docs:** https://tailwindcss.com/docs/dark-mode
- **WCAG Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **next-themes Documentation:** https://github.com/pacocoursey/next-themes
- **Color Palette Generator:** https://coolors.co/

---

**Happy Testing! 🌙✨**

If everything looks great in dark mode, congrats! You now have a beautiful, accessible dark theme that users will love! 🎉
