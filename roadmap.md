# Roadmap

## Phase 1: Laying the Foundations
**Objective:** Establish the core of the plugin with essential features, focusing on full support for a custom calendar.

### Step 1.1: Custom Calendar Modeling
**Actions:**
- Define the precise characteristics of the custom calendar:
  - **Time Units:** Number of days per week, weeks per month, months per year, years per age.
  - **Custom Names:** Names for days, months, years, and ages.
  - **Specific Durations:** Manage leap years, intercalary days, etc.
- Create a data model reflecting these characteristics.

**Outcomes:**
- A robust model of the custom calendar, ready for use in development.

---

### Step 1.2: Technology Selection and Environment Setup
**Actions:**
- Choose appropriate technologies:
  - **UI Framework:** For example, React, Vue.js, or Svelte, compatible with Obsidian.
  - **Calendar Library:** Evaluate whether an existing library can be adapted or if a custom solution is necessary.
- Set up the development environment with the chosen tools.

**Outcomes:**
- A ready-to-use development environment with tools and dependencies installed.

---

### Step 1.3: Displaying the Custom Calendar
**Actions:**
- Develop a calendar interface reflecting the custom system:
  - **Monthly View:** Correctly display days, weeks, and custom months.
  - **Basic Navigation:** Allow navigation between months and years.

**Outcomes:**
- A functional calendar that correctly displays the custom time system.

---

### Step 1.4: Basic Event Management
**Actions:**
- Implement event creation and display:
  - **Event Creation:** Interface for adding events to specific dates.
  - **Event Display:** Visual indicators on dates with events.
  - **Event Details:** Show details when clicking on an event.

**Outcomes:**
- Events can be added and viewed in the custom calendar.

---

### Step 1.5: Integration with Obsidian
**Actions:**
- Integrate the plugin into Obsidian:
  - **Commands:** Add commands to open the calendar.
  - **Styles:** Adapt the design to match Obsidian's theme.
  - **Data Storage:** Decide where and how data will be stored (Markdown files, local database, etc.).

**Outcomes:**
- A plugin accessible within Obsidian, with a consistent appearance.

---

## Phase 2: Enhancing the User Experience
**Objective:** Optimize the interface and add features to improve the user experience.

### Step 2.1: Advanced Navigation
**Actions:**
- Add navigation features:
  - **Multiple Views:** Integrate daily, weekly, yearly, and age-based views.
  - **Quick Navigation:** Selectors for ages, years, months, with the ability to jump directly to a specific date.

**Outcomes:**
- Smooth and intuitive navigation through the calendar.

---

### Step 2.2: Interface Customization
**Actions:**
- Allow customization of the interface:
  - **Themes and Colors:** Options to change colors, fonts, and styles.
  - **Layout Options:** Choose between different calendar layouts.

**Outcomes:**
- An interface adaptable to individual preferences.

---

### Step 2.3: Advanced Event Management
**Actions:**
- Add advanced event features:
  - **Recurring Events:** Support repetitions according to the custom time system.
  - **Categories and Tags:** Classify events for better filtering.
  - **Attachments:** Allow adding files or links to Obsidian notes.

**Outcomes:**
- Richer and more flexible event management.

---

### Step 2.4: Search and Filtering
**Actions:**
- Implement search tools:
  - **Search Bar:** Find events by keywords.
  - **Filters:** Filter by category, date, tag, etc.

**Outcomes:**
- Quick and efficient search for important events.

---

### Step 2.5: Performance Optimization
**Actions:**
- Improve plugin performance:
  - **Asynchronous Loading:** Load data in the background.
  - **Pagination or Virtualization:** Efficiently manage display with large data sets.

**Outcomes:**
- A fast and responsive plugin, even with numerous events.

---

## Phase 3: Advanced Integration and Additional Features
**Objective:** Extend the plugin's features and enhance its integration with Obsidian and other tools.

### Step 3.1: Linking with Obsidian Notes
**Actions:**
- Associate events with notes:
  - **Automatic Backlinks:** Create bidirectional links between events and notes.
  - **Integrated Display:** View a preview of linked notes directly in the calendar.

**Outcomes:**
- Deep integration with Obsidian's note system.

---

### Step 3.2: Notifications and Reminders
**Actions:**
- Add reminders for events:
  - **Internal Notifications:** Alerts within Obsidian.
  - **System Integration:** Option for system notifications (if supported by Obsidian).

**Outcomes:**
- Proactive management of important events.

---

### Step 3.3: Export and Import
**Actions:**
- Enable data exchange:
  - **Export to Standard Formats:** Formats like `.ics` or `.csv`.
  - **Data Import:** Import events from other calendars while respecting the custom system.

**Outcomes:**
- Better interoperability with other applications and services.

---

### Step 3.4: Accessibility and Internationalization
**Actions:**
- Make the plugin accessible to everyone:
  - **Multilingual Support:** Translate the interface as needed.
  - **Accessibility Standards:** Compatibility with screen readers, keyboard navigation.

**Outcomes:**
- An inclusive plugin usable by a wider audience.

---

## Phase 4: Advanced Customization and Innovations
**Objective:** Offer advanced and innovative features to enrich the user experience.

### Step 4.1: Automation and Scripts
**Actions:**
- Enable automation:
  - **Internal API:** Provide methods to interact with the plugin via Obsidian scripts.
  - **Integration with Other Plugins:** Like Templater or Dataview for advanced features.

**Outcomes:**
- Enhanced customization for advanced users.

---

### Step 4.2: Visualizations and Statistics
**Actions:**
- Add analysis tools:
  - **Usage Statistics:** Number of events per month, most used categories, etc.
  - **Graphical Visualizations:** Graphs or charts to represent calendar data.

**Outcomes:**
- Visual insights into calendar usage.

---

## General Considerations

### Documentation and Support
- **Complete Documentation:** Write clear documentation at each phase.
- **Tutorials:** Provide guides or explanatory videos.

### Testing and Quality
- **Unit and Functional Tests:** Ensure reliability at every step.
- **Usability Testing:** Involve real users for concrete feedback.

### User Feedback
- **Surveys and Feedback:** Regularly collect user opinions to guide improvements.

---

## Feature Prioritization

### Essential Features (Phases 1 & 2)
- Full support for the custom calendar.
- Basic event management.
- Intuitive navigation.

### Important Features (Phase 3)
- Advanced integration with Obsidian.
- Notifications and reminders.
- Advanced search and filtering.

### Optional/Advanced Features (Phase 4)
- Automation and scripts.
- Advanced visualizations.

---

## Adapting to the Custom Calendar

### Date Conversion
- Develop algorithms to convert custom calendar dates to system dates.

### Custom Display
- Ensure correct display of days, months, years, and ages.

### Recurrence Calculation
- Adapt recurrence logic to the unique time system.
