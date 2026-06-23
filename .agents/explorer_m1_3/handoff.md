# Handoff Report: UI/UX and Calendar Exploration

## 1. Observation
This investigation observed the UI/UX structures, date inputs, and button click handlers within the BPO financial control application.

### A. New Launch (Lançamento) Registration Locations
- **Company Header Action**: In `workspace.jsx` (lines 39-51), a button labeled "Novo Lançamento" is placed on the top right next to the tab selectors in the `WorkspaceEmpresa` header:
  ```jsx
  <div style={{ display: 'flex', gap: 8 }}>
    <Btn variant="primary" icon="plus" onClick={() => setNovoLancHeader({
      id: uid('lanc'),
      tipo: 'saida',
      ...
    })}>Novo Lançamento</Btn>
  </div>
  ```
- **List Filter Action**: In `workspace.jsx` (line 214), inside `ContasTab`, a smaller button is placed at the end of the filter row:
  ```jsx
  <Btn variant="primary" icon="plus" onClick={() => setNovoLanc({ tipo: 'saida', ... })}>Novo</Btn>
  ```
- **Empty State Action**: In `workspace.jsx` (line 292), inside the list empty state:
  ```jsx
  <Btn variant="primary" icon="plus" onClick={() => setNovoLanc({ tipo: 'saida', vencimento: todayISO(), valor: '' })}>Novo lançamento</Btn>
  ```
- **Global List (Read-only)**: In `reports.jsx`, the screen `Todos os Lançamentos` displays a consolidated grid but contains no creation interface. Instead, line 116 has an onClick handler redirecting the user to the company workspace:
  ```jsx
  <tr key={l.id} style={{ borderBottom: '1px solid var(--c-border)', cursor: 'pointer' }} onClick={() => onOpenEmpresa(l.empresaId)}>
  ```

### B. Dropdown Calendars & Date Input Styling
- **Input Component Implementation**: In `ui.jsx` (lines 180-189), the `Input` component is styled via a static `inputStyle` object:
  ```jsx
  const inputStyle = {
    padding: '8px 12px', fontSize: 14,
    border: '1px solid var(--c-border)', borderRadius: 8, background: 'var(--c-surface)',
    fontFamily: 'inherit', outline: 'none', color: 'var(--c-text)', width: '100%',
    boxSizing: 'border-box',
  };
  function Input(props) {
    return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
  }
  ```
- **Lack of Interactive States**: There are no hover (`:hover`) or focus (`:focus`) state definitions for `<input>` elements in `index.html` or `ui.jsx`. Because `outline: 'none'` is explicitly set in `inputStyle`, focused inputs lack any browser-default focus indicators.
- **Date Type Inputs**: Standard native HTML inputs (`type="date"`) are used for calendar selections (e.g. `workspace.jsx:207-208`, `workspace.jsx:450`, `workspace.jsx:502`, `central.jsx:143-144`, `reports.jsx:85-86`). There are no third-party custom calendar dependencies loaded in `package.json` or `index.html`.
- **Dark Mode Styling**: In `index.html`, inputs in dark mode (`body.dark input`) have backgrounds adjusted, but the calendar picker dropdown icon (`::-webkit-calendar-picker-indicator`) is not stylized, causing low visibility on dark backgrounds.

### C. Handler Audit for Dead Buttons
- All `onClick` attributes in the main source files (`app.jsx`, `central.jsx`, `settings.jsx`, `workspace.jsx`, `reports.jsx`, `tweaks-panel.jsx`, `ui.jsx`) were analyzed.
- **Result**: No dead buttons or unimplemented placeholders were found. All handlers invoke active functions (e.g. `onUpsertLanc`, modal togglers, export scripts, or API auth triggers). A backup file `app_old.jsx` contains legacy code, but it is not imported/active in `index.html`.

---

## 2. Logic Chain

1. **Current Placement Critique**:
   - The "Novo Lançamento" action in the company header (Observation A) is a top bar shortcut which is outside the page's main layout.
   - The inline button in the filter row (Observation A) is positioned far to the right, compressed inside a grid of 8 columns on desktop, making it easy to miss and cramped.
   - Therefore, to make launch creation highly prominent directly on the page (without top-bar shortcuts or FABs), we should embed the registration form directly into the page layout of `ContasTab` (either as an inline form or a split-view panel).

2. **Date Picker Styling Limitations**:
   - The date selection is handled natively by the browser (`<input type="date">`, Observation B).
   - Because styling the inner popover calendar dropdown is restricted by browser Shadow DOM boundaries, we cannot directly customize hover, focus, or selection visibility of the calendar's dates using standard CSS.
   - However, the trigger input itself can and should be styled (border transitions, hover borders, focus glows, and inverting the calendar icon in dark mode).
   - To achieve absolute styling control (custom animations, uniform hover/focus on dates, and selection highlights), a custom React calendar dropdown component is needed.

3. **Dead Button Status**:
   - Every checked button with an `onClick` callback connects to a handler that either edits state, triggers standard browser confirmations, or performs export/print workflows (Observation C).
   - Hence, there are no dead button features in the current implementation.

---

## 3. Caveats
- Browser-specific behavior of native `<input type="date">` may vary (e.g., Safari vs. Chrome vs. Firefox). Mobile devices will render native OS date scroll wheels, which bypasses CSS popover styles.
- Custom calendar popup styling was analyzed under the assumption that the system wants to keep its bundle size small and load things via CDN. Suggestions are provided for both native CSS polish and custom React implementations.

---

## 4. Conclusion

### A. Proposed UI/UX Designs for 'Novo Lançamento'
To make launch registration highly visible and intuitive directly on the page, we propose two layouts:

#### Option 1: Collapsible Quick-Create Section at the Top
Place an inline form card at the very top of `ContasTab` (below KPIs, above filters):
- **Visuals**: A card with a soft accent border and light background (`var(--c-primary-soft)`).
- **Structure**: Fields are aligned horizontally in a grid (Tipo, Descrição, Valor, Vencimento, Centro de Custo, Portador, Forma de Pgto). A large "Cadastrar Lançamento" button sits at the end.
- **Usability**: Fully open by default, with a "Minimizar" toggle to hide/show. This allows BPO analysts to type and submit multiple entries without opening/closing modals.

#### Option 2: Two-Column Split Layout (Desktop)
- **Left Column (~30% width)**: A permanent vertical form panel dedicated entirely to "Novo Lançamento". Features high contrast buttons to toggle between "Entrada" (Green theme) and "Saída" (Red theme), inline validation help text, and a clean keyboard-navigable tab order.
- **Right Column (~70% width)**: Houses the filters grid and the transactions table.
- **Mobile Behavior**: Automatically stacks the Left Column above the Right Column.

---

### B. Proposed Styles for Date Inputs
Add the following CSS rules to the main stylesheet in `index.html`:

1. **Focus and Hover States for Inputs**:
   ```css
   input, select, textarea {
     transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
   }
   input:hover, select:hover, textarea:hover {
     border-color: var(--c-navy-300);
   }
   input:focus, select:focus, textarea:focus {
     border-color: var(--c-primary);
     box-shadow: 0 0 0 3px var(--c-primary-soft);
     outline: none;
   }
   ```

2. **Calendar Icon/Trigger Customization**:
   ```css
   input[type="date"]::-webkit-calendar-picker-indicator {
     cursor: pointer;
     opacity: 0.6;
     transition: opacity 0.15s;
   }
   input[type="date"]::-webkit-calendar-picker-indicator:hover {
     opacity: 1;
   }
   /* Invert color in Dark Mode */
   body.dark input[type="date"]::-webkit-calendar-picker-indicator {
     filter: invert(1);
   }
   ```

3. **Custom Date Picker (React Component Recommendation)**:
   For complete layout consistency, replace `<Input type="date">` with a custom dropdown calendar component styled using standard elements (`div`, `button`, etc.) which can be styled fully with custom hovers and selections in both light and dark modes.

---

## 5. Verification Method
1. **File Locations to Inspect**:
   - Check `workspace.jsx` around lines 39-51, 214, and 292 to confirm current locations of the "Novo Lançamento" buttons.
   - Check `ui.jsx` line 180 to inspect `inputStyle`.
   - Check `index.html` lines 71-76 to confirm input styles in dark mode.
2. **Visual Inspection**:
   - Launch the application and navigate to any company workspace.
   - Press `Tab` to navigate through input fields. Verify that no visual focus indicator is present.
   - Inspect the date picker input icon in dark mode and observe its low contrast.
