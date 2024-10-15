import { App, Plugin, WorkspaceLeaf, ItemView, TFile, Modal } from 'obsidian';
import * as d3 from 'd3';

export default class CustomCalendarTimeline extends Plugin {
    async onload() {
        console.log('Chargement du plugin Custom Calendar Timeline');

        // Enregistrer la vue principale
        this.registerView(
            'main-view',
            (leaf) => new MainView(leaf, this.app)
        );

        // Ajouter une commande pour ouvrir la vue principale
        this.addCommand({
            id: 'open-main-view',
            name: 'Ouvrir la vue principale',
            callback: () => this.activateView()
        });

        // Charger le fichier CSS en injectant le contenu
        this.addStyles();
    }

    async activateView() {
        this.app.workspace.detachLeavesOfType('main-view');

        await this.app.workspace.getLeaf(true).setViewState({
            type: 'main-view',
            active: true
        });
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

        /* Styles pour le calendrier */
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

// Interfaces communes
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
    labelY?: number;
    labelAlignment?: 'top' | 'bottom';
}

// Classe pour parser les données
class CalendarDataParser {
    app: App;
    ages: Age[] = [];
    events: Event[] = [];

    // Définitions du calendrier personnalisé
    jours = ['Clar', 'Flume', 'Éther', 'Armon', 'Flok', 'Mété', 'Chir'];
    mois = ['Massié', 'Rasser', 'Finci', 'Été', 'Visir', 'Comir', 'Arnie', 'Elzeryn', 'Automne', 'Ōure', 'Weelk', 'Frîrr', 'Hiver', 'Aulbe'];

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

            // Expression régulière pour capturer les événements avec description multi-lignes
            const eventRegex = /-\s*\*\*(.*?)\*\*\s*:\s*(.*?)\s*\n\s*-\s*Description\s*:\s*([\s\S]*?)(?=\n-\s*\*\*|$)/gs;
            let match;
            while ((match = eventRegex.exec(eventsSection)) !== null) {
                const dateStr = match[1].trim();

                // Extraire l'âge depuis la date
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
                    continue; // Passer à l'événement suivant
                }
            }
        } else {
            console.error('Section des événements non trouvée dans le fichier calendar.md.');
        }

        return events;
    }

    /**
     * Convertit une date du format personnalisé en un nombre représentant le total des jours écoulés.
     * @param dateStr - La date au format personnalisé (ex: "3 Clar de Massié, Année 30 du 7e âge").
     * @returns Le nombre total de jours écoulés depuis le début du calendrier.
     */
    convertDateToNumber(dateStr: string): number {
        // Exemple : "3 Clar de Massié, Année 30 du 7e âge"
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

            // Vérifier que le jour et le mois existent
            if (!jours.includes(dayName)) {
                throw new Error(`Jour invalide: ${dayName}`);
            }
            if (!mois.includes(monthName)) {
                throw new Error(`Mois invalide: ${monthName}`);
            }

            // Calculer le total des jours
            let totalDays = 0;

            // Ajouter les jours des âges précédents
            for (let i = 0; i < this.ages.length; i++) {
                if (this.ages[i].number < age) {
                    totalDays += this.ages[i].duration * mois.length * jours.length * 4; // Supposons 4 semaines par mois
                } else {
                    break;
                }
            }

            // Trouver l'âge actuel
            const currentAge = this.ages.find(a => a.number === age);
            if (!currentAge) {
                throw new Error(`Âge invalide: ${age}`);
            }

            // Vérifier que l'année est dans l'intervalle de l'âge
            if (year < currentAge.startYear || year > currentAge.endYear) {
                throw new Error(`Année ${year} hors de l'intervalle de l'âge ${age}`);
            }

            // Ajouter les années dans l'âge actuel
            totalDays += (year - currentAge.startYear) * mois.length * jours.length * 4;

            // Ajouter les mois
            const monthIndex = mois.indexOf(monthName);
            totalDays += monthIndex * jours.length * 4;

            // Ajouter le jour (numéro de jour dans le mois)
            totalDays += (day - 1);

            return totalDays;
        } else {
            throw new Error(`Date invalide ou format incorrect: ${dateStr}`);
        }
    }

    formatDateFromNumeric(numericDate: number): string {
        let remainingDays = numericDate;

        for (let i = 0; i < this.ages.length; i++) {
            const age = this.ages[i];
            const ageDurationDays = age.duration * this.mois.length * this.jours.length * 4;
            if (remainingDays < ageDurationDays) {
                const yearInAge = Math.floor(remainingDays / (this.mois.length * this.jours.length * 4)) + age.startYear;
                remainingDays = remainingDays % (this.mois.length * this.jours.length * 4);
                const monthIndex = Math.floor(remainingDays / (this.jours.length * 4));
                remainingDays = remainingDays % (this.jours.length * 4);
                const day = remainingDays + 1; // Les jours commencent à 1

                const monthName = this.mois[monthIndex];

                return `${day} de ${monthName}, Année ${yearInAge} du ${age.number}e âge`;
            } else {
                remainingDays -= ageDurationDays;
            }
        }
        return `Date inconnue`;
    }
}

// Vue principale
class MainView extends ItemView {
    app: App;
    parser: CalendarDataParser;
    container!: HTMLElement;
    contentContainer!: HTMLElement;
    currentMode: string = 'horizontal'; // Modes possibles: 'horizontal', 'vertical', 'calendar', 'text'

    constructor(leaf: WorkspaceLeaf, app: App) {
        super(leaf);
        this.app = app;
        this.parser = new CalendarDataParser(app);
    }

    getViewType() {
        return 'main-view';
    }

    getDisplayText() {
        return 'Vue Principale';
    }

    async onOpen() {
        this.container = this.contentEl;

        // Définir explicitement la taille du conteneur
        this.container.style.width = '100%';
        this.container.style.height = '100%';

        // Créer la barre de navigation
        this.createNavigationBar();

        // Créer le conteneur de contenu
        this.contentContainer = this.container.createDiv();

        // Charger les données
        try {
            await this.parser.loadData();

            if (this.parser.events.length > 0) {
                // Afficher la vue par défaut
                this.displayCurrentMode();
            } else {
                this.contentContainer.createEl('p', { text: 'Aucun événement trouvé dans calendar.md.' });
            }
        } catch (error) {
            this.contentContainer.createEl('p', { text: error instanceof Error ? error.message : String(error) });
        }

        // Enregistrer l'écouteur d'événement pour les modifications du fichier
        this.registerEvent(
            this.app.vault.on('modify', async (file) => {
                if (file instanceof TFile && file.path === 'calendar.md') {
                    await this.refreshView();
                }
            })
        );
    }

    async refreshView() {
        // Recharger les données et rafraîchir la vue
        try {
            await this.parser.loadData();
            this.displayCurrentMode();
        } catch (error) {
            this.contentContainer.empty();
            this.contentContainer.createEl('p', { text: error instanceof Error ? error.message : String(error) });
        }
    }

    createNavigationBar() {
        const navBar = this.container.createDiv({ cls: 'navigation-bar' });

        const modes = [
            { id: 'horizontal', label: 'Timeline Horizontale' },
            { id: 'vertical', label: 'Timeline Verticale' },
            { id: 'calendar', label: 'Calendrier' },
            { id: 'text', label: 'Vue Texte' },
        ];

        modes.forEach(mode => {
            const button = navBar.createEl('button', { text: mode.label, cls: 'nav-button' });
            button.addEventListener('click', () => {
                this.currentMode = mode.id;
                this.updateActiveButton(navBar, button);
                this.displayCurrentMode();
            });

            if (mode.id === this.currentMode) {
                button.addClass('active');
            }
        });
    }

    updateActiveButton(navBar: HTMLElement, activeButton: HTMLElement) {
        navBar.querySelectorAll('.nav-button').forEach(button => {
            button.removeClass('active');
        });
        activeButton.addClass('active');
    }

    displayCurrentMode() {
        // Vider le conteneur de contenu
        this.contentContainer.empty();

        // Afficher le mode actuel
        switch (this.currentMode) {
            case 'horizontal':
                this.createHorizontalTimeline(this.contentContainer, this.parser.events);
                break;
            case 'vertical':
                this.createVerticalTimeline(this.contentContainer, this.parser.events);
                break;
            case 'calendar':
                this.createCalendarView(this.contentContainer, this.parser.events);
                break;
            case 'text':
                this.createTextView(this.contentContainer);
                break;
            default:
                this.contentContainer.createEl('p', { text: 'Mode inconnu.' });
        }
    }

    // Timeline horizontale
    createHorizontalTimeline(container: HTMLElement, events: Event[]) {
        container.empty();

        const width = container.clientWidth || 800;
        const height = 500;

        // Déclaration du tooltip avec le type approprié
        let tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;

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

            // Taille minimale et maximale des cercles
            const minRadius = 2;
            const maxRadius = 20;
            const newRadius = Math.max(minRadius, Math.min(maxRadius, 10 / event.transform.k));

            // Adapter la taille des cercles
            g.selectAll('circle')
                .attr('r', newRadius);

            // Taille minimale et maximale de la police
            const minFontSize = 8;
            const maxFontSize = 24;
            const newFontSize = Math.max(minFontSize, Math.min(maxFontSize, 12 / event.transform.k));

            // Adapter la taille des polices
            g.selectAll('text')
                .style('font-size', `${newFontSize}px`);
        }

        // Définir l'échelle en x
        const xScale = d3.scaleLinear()
            .domain([d3.min(events, d => d.numericDate)!, d3.max(events, d => d.numericDate)!])
            .range([50, width - 50]);

        // Ajouter une ligne pour la timeline
        g.append('line')
            .attr('x1', 50)
            .attr('y1', height / 2)
            .attr('x2', width - 50)
            .attr('y2', height / 2)
            .attr('stroke', 'var(--text-normal)')
            .attr('stroke-width', 2);

        // Ajouter l'axe temporel personnalisé pour les âges
        const xAxis = d3.axisBottom(xScale)
            .ticks(10)
            .tickFormat(d => this.parser.formatDateFromNumeric(d as number));

        g.append('g')
            .attr('transform', `translate(0, ${height - 50})`)
            .call(xAxis);

        // Créer une échelle de couleurs pour les âges
        const colorScale = d3.scaleOrdinal<number, string>()
            .domain(Array.from(new Set(events.map(d => d.age))))
            .range(d3.schemeCategory10);

        // Positionnement des labels pour éviter les chevauchements
        const nodes = events.map(event => ({
            x: xScale(event.numericDate),
            y: height / 2,
            fx: xScale(event.numericDate), // Fixer la position x
            event: event
        }));

        // Simulation de forces pour répartir les labels
        d3.forceSimulation(nodes)
            .force('y', d3.forceY().strength(1).y((d, i) => (i % 2 === 0) ? (height / 2 - 50) : (height / 2 + 50)))
            .force('collision', d3.forceCollide(30))
            .stop()
            .tick(300);

        // Ajouter les cercles pour les événements
        g.selectAll('circle')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('cx', d => d.x)
            .attr('cy', height / 2)
            .attr('r', 10)
            .attr('fill', d => colorScale(d.event.age))
            .on('mouseover', (event, d) => {
                const [mouseX, mouseY] = d3.pointer(event);

                // Créer ou sélectionner le tooltip
                tooltip = d3.select(container).select<HTMLDivElement>('.tooltip');
                if (tooltip.empty()) {
                    tooltip = d3.select(container)
                        .append('div')
                        .attr('class', 'tooltip');
                }

                tooltip
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 28) + 'px')
                    .html(`<strong>${d.event.title}</strong><br/>${d.event.date}<br/>${d.event.description}`)
                    .style('opacity', '1');
            })
            .on('mouseout', () => {
                d3.select(container).select('.tooltip').style('opacity', '0');
            });

        // Ajouter les labels des événements
        g.selectAll('text.event-label')
            .data(nodes)
            .enter()
            .append('text')
            .attr('class', 'event-label')
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('text-anchor', 'middle')
            .text(d => d.event.title)
            .style('font-size', '12px');

        // Ajouter des lignes reliant les labels aux cercles
        g.selectAll('line.label-line')
            .data(nodes)
            .enter()
            .append('line')
            .attr('class', 'label-line')
            .attr('x1', d => d.x)
            .attr('y1', height / 2)
            .attr('x2', d => d.x)
            .attr('y2', d => d.y)
            .attr('stroke', 'var(--text-muted)')
            .attr('stroke-dasharray', '2,2');
    }

    // Timeline verticale
    createVerticalTimeline(container: HTMLElement, events: Event[]) {
        container.empty();

        const width = container.clientWidth || 800;
        const height = container.clientHeight || 600;

        // Déclaration du tooltip avec le type approprié
        let tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined>;

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

            // Taille minimale et maximale des cercles
            const minRadius = 2;
            const maxRadius = 20;
            const newRadius = Math.max(minRadius, Math.min(maxRadius, 10 / event.transform.k));

            // Adapter la taille des cercles
            g.selectAll('circle')
                .attr('r', newRadius);

            // Taille minimale et maximale de la police
            const minFontSize = 8;
            const maxFontSize = 24;
            const newFontSize = Math.max(minFontSize, Math.min(maxFontSize, 12 / event.transform.k));

            // Adapter la taille des polices
            g.selectAll('text')
                .style('font-size', `${newFontSize}px`);
        }

        // Définir l'échelle en y
        const yScale = d3.scaleLinear()
            .domain([d3.min(events, d => d.numericDate)!, d3.max(events, d => d.numericDate)!])
            .range([50, height - 50]);

        // Ajouter une ligne pour la timeline
        g.append('line')
            .attr('x1', width / 2)
            .attr('y1', 50)
            .attr('x2', width / 2)
            .attr('y2', height - 50)
            .attr('stroke', 'var(--text-normal)')
            .attr('stroke-width', 2);

        // Ajouter l'axe temporel personnalisé pour les âges
        const yAxis = d3.axisLeft(yScale)
            .ticks(10)
            .tickFormat(d => this.parser.formatDateFromNumeric(d as number));

        g.append('g')
            .attr('transform', `translate(50, 0)`)
            .call(yAxis);

        // Créer une échelle de couleurs pour les âges
        const colorScale = d3.scaleOrdinal<number, string>()
            .domain(Array.from(new Set(events.map(d => d.age))))
            .range(d3.schemeCategory10);

        // Positionnement des labels pour éviter les chevauchements
        const nodes = events.map(event => ({
            x: width / 2,
            y: yScale(event.numericDate),
            fy: yScale(event.numericDate), // Fixer la position y
            event: event
        }));

        // Simulation de forces pour répartir les labels
        d3.forceSimulation(nodes)
            .force('x', d3.forceX().strength(1).x((d, i) => (i % 2 === 0) ? (width / 2 - 100) : (width / 2 + 100)))
            .force('collision', d3.forceCollide(30))
            .stop()
            .tick(300);

        // Ajouter les cercles pour les événements
        g.selectAll('circle')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('cx', width / 2)
            .attr('cy', d => d.y)
            .attr('r', 10)
            .attr('fill', d => colorScale(d.event.age))
            .on('mouseover', (event, d) => {
                const [mouseX, mouseY] = d3.pointer(event);

                // Créer ou sélectionner le tooltip
                tooltip = d3.select(container).select<HTMLDivElement>('.tooltip');
                if (tooltip.empty()) {
                    tooltip = d3.select(container)
                        .append('div')
                        .attr('class', 'tooltip');
                }

                tooltip
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 28) + 'px')
                    .html(`<strong>${d.event.title}</strong><br/>${d.event.date}<br/>${d.event.description}`)
                    .style('opacity', '1');
            })
            .on('mouseout', () => {
                d3.select(container).select('.tooltip').style('opacity', '0');
            });

        // Ajouter les labels des événements
        g.selectAll('text.event-label')
            .data(nodes)
            .enter()
            .append('text')
            .attr('class', 'event-label')
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('dx', d => (d.x < width / 2) ? -10 : 10)
            .attr('text-anchor', d => (d.x < width / 2) ? 'end' : 'start')
            .text(d => d.event.title)
            .style('font-size', '12px');

        // Ajouter des lignes reliant les labels aux cercles
        g.selectAll('line.label-line')
            .data(nodes)
            .enter()
            .append('line')
            .attr('class', 'label-line')
            .attr('x1', width / 2)
            .attr('y1', d => d.y)
            .attr('x2', d => d.x)
            .attr('y2', d => d.y)
            .attr('stroke', 'var(--text-muted)')
            .attr('stroke-dasharray', '2,2');
    }

    // Vue calendrier
    createCalendarView(container: HTMLElement, events: Event[]) {
        container.empty();

        // Créer un conteneur pour le calendrier
        const calendarContainer = container.createDiv({ cls: 'calendar-container' });

        // Obtenir la date actuelle ou la date du premier événement
        let currentNumericDate = this.parser.events.length > 0 ? this.parser.events[0].numericDate : 0;

        // Afficher le calendrier pour la date actuelle
        this.renderCalendar(calendarContainer, currentNumericDate, events);
    }

    renderCalendar(container: HTMLElement, numericDate: number, events: Event[], displayEntireAge: boolean = false) {
        container.empty();

        // Convertir numericDate en année, mois et jour personnalisés
        const { ageNumber, year, monthIndex } = this.getCustomDateFromNumeric(numericDate);

        // Obtenir les événements pour la période sélectionnée
        let eventsToDisplay: Event[] = [];

        if (displayEntireAge) {
            // Afficher tous les événements de l'âge
            eventsToDisplay = events.filter(event => {
                const eventDate = this.getCustomDateFromNumeric(event.numericDate);
                return eventDate.ageNumber === ageNumber;
            });
        } else {
            // Obtenir les événements du mois
            eventsToDisplay = events.filter(event => {
                const eventDate = this.getCustomDateFromNumeric(event.numericDate);
                return eventDate.monthIndex === monthIndex && eventDate.year === year && eventDate.ageNumber === ageNumber;
            });
        }

        // Créer l'en-tête du calendrier avec les sélecteurs
        const header = container.createDiv({ cls: 'calendar-header' });

        // Navigation avec des sélecteurs
        const navigation = header.createDiv({ cls: 'calendar-navigation' });

        // Sélecteur d'âge
        const ageSelect = navigation.createEl('select');
        this.parser.ages.forEach(age => {
            const option = ageSelect.createEl('option', { text: `${age.number}e âge`, value: age.number.toString() });
            if (age.number === ageNumber) {
                option.selected = true;
            }
        });

        // Sélecteur d'année
        const yearSelect = navigation.createEl('select');
        const currentAge = this.parser.ages.find(a => a.number === ageNumber)!;
        for (let y = currentAge.startYear; y <= currentAge.endYear; y++) {
            const option = yearSelect.createEl('option', { text: `Année ${y}`, value: y.toString() });
            if (y === year) {
                option.selected = true;
            }
        }

        // Sélecteur de mois
        const monthSelect = navigation.createEl('select');
        this.parser.mois.forEach((month, index) => {
            const option = monthSelect.createEl('option', { text: month, value: index.toString() });
            if (index === monthIndex) {
                option.selected = true;
            }
        });

        // Bouton pour afficher l'âge entier
        const ageButton = navigation.createEl('button', { text: 'Afficher l\'âge entier' });
        ageButton.addEventListener('click', () => {
            const newNumericDate = this.getNumericDateFromCustomDate(ageNumber, year, monthIndex, 0);
            this.renderCalendar(container, newNumericDate, events, true);
        });

        // Écouteurs pour les sélecteurs
        ageSelect.addEventListener('change', () => {
            const selectedAgeNumber = parseInt(ageSelect.value);
            const selectedYear = this.parser.ages.find(a => a.number === selectedAgeNumber)!.startYear;
            const newNumericDate = this.getNumericDateFromCustomDate(selectedAgeNumber, selectedYear, 0, 0);
            this.renderCalendar(container, newNumericDate, events);
        });

        yearSelect.addEventListener('change', () => {
            const selectedYear = parseInt(yearSelect.value);
            const newNumericDate = this.getNumericDateFromCustomDate(ageNumber, selectedYear, 0, 0);
            this.renderCalendar(container, newNumericDate, events);
        });

        monthSelect.addEventListener('change', () => {
            const selectedMonthIndex = parseInt(monthSelect.value);
            const newNumericDate = this.getNumericDateFromCustomDate(ageNumber, year, selectedMonthIndex, 0);
            this.renderCalendar(container, newNumericDate, events);
        });

        // Afficher le titre du calendrier
        header.createEl('h2', { text: displayEntireAge ? `${ageNumber}e âge` : `${this.parser.mois[monthIndex]} ${year} du ${ageNumber}e âge` });

        // Créer la grille du calendrier
        const calendarGrid = container.createDiv({ cls: 'calendar-grid' });

        // Ajouter les jours de la semaine
        const daysOfWeek = this.parser.jours;
        const daysRow = calendarGrid.createDiv({ cls: 'calendar-row days-of-week' });
        daysOfWeek.forEach(day => {
            daysRow.createDiv({ cls: 'calendar-cell day-name', text: day });
        });

        if (displayEntireAge) {
            // Afficher tous les mois et années de l'âge
            for (let y = currentAge.startYear; y <= currentAge.endYear; y++) {
                for (let m = 0; m < this.parser.mois.length; m++) {
                    this.renderMonth(calendarGrid, ageNumber, y, m, eventsToDisplay);
                }
            }
        } else {
            // Afficher le mois sélectionné
            this.renderMonth(calendarGrid, ageNumber, year, monthIndex, eventsToDisplay);
        }
    }

    renderMonth(calendarGrid: HTMLElement, ageNumber: number, year: number, monthIndex: number, events: Event[]) {
        // Afficher le nom du mois et de l'année
        const monthHeader = calendarGrid.createDiv({ cls: 'calendar-month-header' });
        monthHeader.createEl('h3', { text: `${this.parser.mois[monthIndex]} ${year}` });

        // Nombre de jours dans le mois (jours par semaine * nombre de semaines)
        const daysInMonth = this.parser.jours.length * 4; // Supposons 4 semaines de 7 jours

        // Générer les jours du mois
        let dayCounter = 1;

        for (let week = 0; week < 4; week++) {
            const weekRow = calendarGrid.createDiv({ cls: 'calendar-row' });

            for (let dayIndex = 0; dayIndex < this.parser.jours.length; dayIndex++) {
                const cell = weekRow.createDiv({ cls: 'calendar-cell' });

                // Afficher le jour
                cell.createEl('span', { cls: 'date-number', text: dayCounter.toString() });

                // Vérifier s'il y a des événements pour ce jour
                const eventsForDay = events.filter(event => {
                    const eventDate = this.getCustomDateFromNumeric(event.numericDate);
                    return eventDate.day === dayCounter && eventDate.monthIndex === monthIndex && eventDate.year === year && eventDate.ageNumber === ageNumber;
                });

                // Afficher les événements
                eventsForDay.forEach(event => {
                    const eventDiv = cell.createDiv({ cls: 'calendar-event', text: event.title });
                    eventDiv.addEventListener('click', () => {
                        // Afficher les détails de l'événement
                        new EventModal(this.app, event).open();
                    });
                });

                dayCounter++;
            }
        }
    }

    getCustomDateFromNumeric(numericDate: number): { ageNumber: number; year: number; monthIndex: number; day: number } {
        let remainingDays = numericDate;
        let ageNumber = 0;
        let year = 0;

        // Calculer l'âge et l'année
        for (let i = 0; i < this.parser.ages.length; i++) {
            const age = this.parser.ages[i];
            const ageDurationDays = age.duration * this.parser.mois.length * this.parser.jours.length * 4; // Supposons 4 semaines par mois
            if (remainingDays < ageDurationDays) {
                ageNumber = age.number;
                year = age.startYear + Math.floor(remainingDays / (this.parser.mois.length * this.parser.jours.length * 4));
                remainingDays = remainingDays % (this.parser.mois.length * this.parser.jours.length * 4);
                break;
            } else {
                remainingDays -= ageDurationDays;
            }
        }

        // Calculer le mois
        const monthIndex = Math.floor(remainingDays / (this.parser.jours.length * 4));
        remainingDays = remainingDays % (this.parser.jours.length * 4);

        // Calculer le jour
        const day = remainingDays + 1; // +1 car les jours commencent à 1

        return { ageNumber, year, monthIndex, day };
    }

    getNumericDateFromCustomDate(ageNumber: number, year: number, monthIndex: number, day: number): number {
        let totalDays = 0;

        // Ajouter les jours des âges précédents
        for (let i = 0; i < this.parser.ages.length; i++) {
            const age = this.parser.ages[i];
            if (age.number < ageNumber) {
                totalDays += age.duration * this.parser.mois.length * this.parser.jours.length * 4;
            } else if (age.number === ageNumber) {
                // Ajouter les années dans l'âge actuel
                totalDays += (year - age.startYear) * this.parser.mois.length * this.parser.jours.length * 4;
                break;
            }
        }

        // Ajouter les mois
        totalDays += monthIndex * this.parser.jours.length * 4;

        // Ajouter le jour
        totalDays += day;

        return totalDays;
    }

    // Vue texte
    createTextView(container: HTMLElement) {
        container.empty();

        // Afficher le contenu du fichier calendar.md
        const calendarFile = this.app.vault.getAbstractFileByPath('calendar.md');
        if (calendarFile instanceof TFile) {
            this.app.vault.read(calendarFile).then(content => {
                const pre = container.createEl('pre');
                pre.textContent = content;
            });
        } else {
            container.createEl('p', { text: 'Le fichier calendar.md est introuvable.' });
        }
    }

    async onClose() {
        // Nettoyer le contenu si nécessaire
        this.container.empty();
    }
}

// Classe pour afficher les détails de l'événement dans une modal
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
