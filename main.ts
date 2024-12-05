import { App, Plugin, WorkspaceLeaf, ItemView, TFile, Modal } from 'obsidian';
import * as d3 from 'd3';

const VIEW_TYPE_TIMELINE = 'custom-timeline-view';

export default class CustomCalendarTimeline extends Plugin {
    async onload() {
        console.log('Custom Calendar Timeline plugin loaded');

        // Add a ribbon icon to the left toolbar
        this.addRibbonIcon('calendar', 'Open Custom Calendar Timeline', () => {
            this.activateView();
        });

        // Register the custom view
        this.registerView(
            VIEW_TYPE_TIMELINE,
            (leaf) => new TimelineView(leaf, this.app)
        );

        // Register a command to activate the view
        this.addCommand({
            id: 'open-main-view',
            name: 'Open Custom Calendar Timeline',
            callback: () => this.activateView()
        });

        // Load custom styles
        this.addStyles();
    }

    async activateView() {
        const leaf = this.app.workspace.getLeaf(true);
        await leaf.setViewState({
            type: VIEW_TYPE_TIMELINE,
            active: true,
        });
        this.app.workspace.revealLeaf(leaf);
    }

    addStyles() {
        const css = `
        .navigation-bar {
            display: flex;
            border-bottom: 1px solid var(--background-modifier-border);
            margin-bottom: 10px;
        }
        .nav-button {
            padding: 8px 12px;
            cursor: pointer;
            border: none;
            background: none;
            font-size: 14px;
            color: var(--text-normal);
        }
        .nav-button.active {
            border-bottom: 2px solid var(--interactive-accent);
            color: var(--interactive-accent);
        }
        .tooltip {
            position: absolute;
            text-align: center;
            padding: 8px;
            font-size: 14px;
            background: var(--background-primary);
            color: var(--text-normal);
            border: 1px solid var(--background-modifier-border);
            border-radius: 4px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease-in-out;
        }
        .axis path,
        .axis line {
            fill: none;
            stroke: var(--text-normal);
            shape-rendering: crispEdges;
        }
        .axis text {
            font-family: var(--font-family);
            font-size: 12px;
            fill: var(--text-normal);
        }
        .event-label {
            font-family: var(--font-family);
            font-size: 12px;
            fill: var(--text-normal);
        }
        .label-line {
            stroke: var(--text-muted);
            stroke-dasharray: 2,2;
        }
        .calendar-container {
            width: 100%;
        }
        .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .calendar-header h2 {
            margin: 0;
        }
        .calendar-grid {
            display: flex;
            flex-direction: column;
        }
        .calendar-row {
            display: flex;
        }
        .calendar-cell {
            flex: 1;
            border: 1px solid var(--background-modifier-border);
            min-height: 80px;
            position: relative;
            padding: 4px;
            box-sizing: border-box;
        }
        .calendar-cell.empty {
            background-color: var(--background-secondary);
        }
        .calendar-cell .date-number {
            position: absolute;
            top: 4px;
            right: 4px;
            font-size: 12px;
            color: var(--text-muted);
        }
        .calendar-event {
            background-color: var(--interactive-accent);
            color: var(--text-on-accent);
            padding: 2px 4px;
            border-radius: 4px;
            margin-top: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        .calendar-event:hover {
            background-color: var(--interactive-accent-hover);
        }
        .days-of-week {
            background-color: var(--background-secondary);
        }
        .day-name {
            text-align: center;
            font-weight: bold;
            padding: 4px 0;
        }
        .calendar-navigation {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        .calendar-navigation select {
            padding: 4px;
            font-size: 14px;
        }
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }
}

// Define the custom view
class TimelineView extends ItemView {
    app: App;
    container!: HTMLElement;
    currentMode: string = 'text';  // Default mode is text (like a regular note)
    parser: CalendarDataParser;

    constructor(leaf: WorkspaceLeaf, app: App) {
        super(leaf);
        this.app = app;
        this.parser = new CalendarDataParser(app);
    }

    getViewType() {
        return VIEW_TYPE_TIMELINE;
    }

    getDisplayText() {
        return 'Custom Calendar Timeline';
    }

    async onOpen() {
        this.container = this.contentEl;

        // Set container size
        this.container.style.width = '100%';
        this.container.style.height = '100%';

        // Create the custom toolbar for switching views
        this.createToolbar();

        // Create the content container for the view
        const contentContainer = this.container.createDiv({ cls: 'timeline-content' });

        // Load data and show the default text view
        try {
            await this.parser.loadData();
            this.displayTextView(contentContainer);
        } catch (error) {
            contentContainer.createEl('p', { text: 'Failed to load calendar.md data.' });
        }
    }

    createToolbar() {
        const toolbar = this.container.createDiv({ cls: 'custom-toolbar' });

        // Create buttons for switching views
        const modes = [
            { id: 'text', label: 'Text View' },
            { id: 'horizontal', label: 'Horizontal Timeline' },
            { id: 'vertical', label: 'Vertical Timeline' },
        ];

        modes.forEach((mode) => {
            const button = toolbar.createEl('button', { text: mode.label });
            button.addEventListener('click', () => {
                this.currentMode = mode.id;
                this.displayCurrentMode();
            });
        });
    }

    displayCurrentMode() {
        const contentContainer = this.container.querySelector('.timeline-content');
        contentContainer.empty();

        switch (this.currentMode) {
            case 'text':
                this.displayTextView(contentContainer);
                break;
            case 'horizontal':
                this.displayHorizontalTimeline(contentContainer);
                break;
            case 'vertical':
                this.displayVerticalTimeline(contentContainer);
                break;
            default:
                contentContainer.createEl('p', { text: 'Unknown mode.' });
        }
    }

    displayTextView(container: HTMLElement) {
        // Render a text area or note-like interface
        const textArea = container.createEl('textarea', {
            cls: 'timeline-text-input',
            attr: { rows: '10', cols: '80', placeholder: 'Enter your timeline data here...' }
        });
        textArea.style.width = '100%';
        textArea.style.height = '400px';
    }

    displayHorizontalTimeline(container: HTMLElement) {
        container.empty();
        const width = container.clientWidth || 800;
        const height = 500;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .call(d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.5, 10])
                .on('zoom', zoomed));

        const g = svg.append('g');

        function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
            g.attr('transform', event.transform.toString());
        }

        // Define your horizontal timeline rendering here
    }

    displayVerticalTimeline(container: HTMLElement) {
        container.empty();
        const width = container.clientWidth || 800;
        const height = 600;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .call(d3.zoom<SVGSVGElement, unknown>()
                .scaleExtent([0.5, 10])
                .on('zoom', zoomed));

        const g = svg.append('g');

        function zoomed(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
            g.attr('transform', event.transform.toString());
        }

        // Define your vertical timeline rendering here
    }

    async onClose() {
        // Clean up the content when the view is closed
        this.container.empty();
    }
}

// CalendarDataParser class to handle parsing and event management
interface Age {
    number: number;
    startYear: number;
    endYear: number;
    duration: number;
}

interface Event {
    date: string;
    title: string;
    description: string;
    numericDate: number;
    age: number;
}

class CalendarDataParser {
    app: App;
    ages: Age[] = [];
    events: Event[] = [];

    jours = ['Clar', 'Flume', 'Éther', 'Armon', 'Flok', 'Mété', 'Chir'];
    mois = ["Massié", "Rasser", "Finci", "Visir", "Comir", "Arnie", "Elzeryn", "Ōure", "Weelk", "Frîrr", "Aulbe", "Scholl", "Midnay", "Cabir"];

    constructor(app: App) {
        this.app = app;
    }

    async loadData() {
        const calendarFile = this.app.vault.getAbstractFileByPath('calendar.md');
        if (calendarFile instanceof TFile) {
            const content = await this.app.vault.read(calendarFile);
            this.ages = this.parseAges(content);
            this.events = this.parseEvents(content);
        } else {
            throw new Error('Le fichier calendar.md est introuvable.');
        }
    }

    parseAges(content: string): Age[] {
        let ages: Age[] = [];

        const agesSectionMatch = content.match(/## Âges\s*([\s\S]*?)(?:\n##|$)/);
        if (agesSectionMatch) {
            const agesSection = agesSectionMatch[1];
            const ageRegex = /-\s*\*\*(\d+)(?:er|e|ème)?\s+âge\*\*\s*:\s*Année\s*(\d+)\s*à\s*Année\s*(\d+)/gi;
            let match;
            while ((match = ageRegex.exec(agesSection)) !== null) {
                const ageNumberStr = match[1];
                const ageNumber = parseInt(ageNumberStr);
                const startYear = parseInt(match[2]);
                const endYear = parseInt(match[3]);
                const duration = endYear - startYear + 1;

                const age: Age = {
                    number: ageNumber,
                    startYear: startYear,
                    endYear: endYear,
                    duration: duration
                };
                ages.push(age);
            }
        } else {
            console.error('Section des âges non trouvée dans le fichier calendar.md.');
        }

        return ages;
    }

    parseEvents(content: string): Event[] {
        let events: Event[] = [];

        const eventsSectionMatch = content.match(/## Événements\s*([\s\S]*)/);
        if (eventsSectionMatch) {
            const eventsSection = eventsSectionMatch[1];

            const eventRegex = /-\s*\*\*(.*?)\*\*\s*:\s*(.*?)\s*\n\s*-\s*Description\s*:\s*([\s\S]*?)(?=\n-\s*\*\*|$)/gs;
            let match;
            while ((match = eventRegex.exec(eventsSection)) !== null) {
                const dateStr = match[1].trim();

                const ageMatch = dateStr.match(/du\s+(\d+)(?:er|e|ème)?\s+âge/);
                const ageNumber = ageMatch ? parseInt(ageMatch[1]) : 0;

                try {
                    const numericDate = this.convertDateToNumber(dateStr);

                    const event: Event = {
                        date: dateStr,
                        title: match[2].trim(),
                        description: match[3].trim(),
                        numericDate: numericDate,
                        age: ageNumber
                    };
                    events.push(event);
                } catch (error) {
                    if (error instanceof Error) {
                        console.error(error.message);
                    } else {
                        console.error(error);
                    }
                    continue;
                }
            }
        } else {
            console.error('Section des événements non trouvée dans le fichier calendar.md.');
        }

        return events;
    }

    convertDateToNumber(dateStr: string): number {
        const jours = this.jours;
        const mois = this.mois;

        const dateRegex = /(\d+)\s+([a-zA-ZÀ-ÿ]+)\s+de\s+([a-zA-ZÀ-ÿ]+),\s+Année\s+(\d+)\s+du\s+(\d+)(?:er|e|ème)?\s+âge/;
        const match = dateStr.match(dateRegex);
        if (match) {
            const day = parseInt(match[1]);
            const dayName = match[2];
            const monthName = match[3];
            const year = parseInt(match[4]);
            const age = parseInt(match[5]);

            if (!jours.includes(dayName)) {
                throw new Error(`Jour invalide: ${dayName}`);
            }
            if (!mois.includes(monthName)) {
                throw new Error(`Mois invalide: ${monthName}`);
            }

            let totalDays = 0;

            for (let i = 0; i < this.ages.length; i++) {
                if (this.ages[i].number < age) {
                    totalDays += this.ages[i].duration * mois.length * jours.length * 4;
                } else {
                    break;
                }
            }

            const currentAge = this.ages.find(a => a.number === age);
            if (!currentAge) {
                throw new Error(`Âge invalide: ${age}`);
            }

            if (year < currentAge.startYear || year > currentAge.endYear) {
                throw new Error(`Année ${year} hors de l'intervalle de l'âge ${age}`);
            }

            totalDays += (year - currentAge.startYear) * mois.length * jours.length * 4;

            const monthIndex = mois.indexOf(monthName);
            totalDays += monthIndex * jours.length * 4;

            totalDays += (day - 1);

            return totalDays;
        } else {
            throw new Error(`Date invalide ou format incorrect: ${dateStr}`);
        }
    }
}

// EventModal class to display event details
class EventModal extends Modal {
    event: Event;

    constructor(app: App, event: Event) {
        super(app);
        this.event = event;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: this.event.title });
        contentEl.createEl('p', { text: `Date : ${this.event.date}` });
        contentEl.createEl('p', { text: this.event.description });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
