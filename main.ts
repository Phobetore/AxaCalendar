// main.ts

import { App, Plugin, WorkspaceLeaf, ItemView, TFile } from 'obsidian';
import * as d3 from 'd3';

export default class CustomCalendarTimeline extends Plugin {
    async onload() {
        console.log('Chargement du plugin Custom Calendar Timeline');

        this.registerView(
            'custom-calendar-timeline-view',
            (leaf) => new TimelineView(leaf, this.app)
        );

        this.addCommand({
            id: 'open-custom-timeline',
            name: 'Ouvrir la timeline personnalisée',
            callback: () => this.activateView()
        });

        // Charger le fichier CSS en injectant le contenu
        this.addStyles();
    }

    async activateView() {
        this.app.workspace.detachLeavesOfType('custom-calendar-timeline-view');

        await this.app.workspace.getLeaf(true).setViewState({
            type: 'custom-calendar-timeline-view',
            active: true
        });
    }

    addStyles() {
        const css = `
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
        `;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }
}

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

class TimelineView extends ItemView {
    app: App;
    ages: Age[] = [];

    constructor(leaf: WorkspaceLeaf, app: App) {
        super(leaf);
        this.app = app;
    }

    getViewType() {
        return 'custom-calendar-timeline-view';
    }

    getDisplayText() {
        return 'Timeline Personnalisée';
    }

    async onOpen() {
        console.log('onOpen called');
        const container = this.contentEl;

        // Définir explicitement la taille du conteneur
        container.style.width = '100%';
        container.style.height = '100%';

        // Charger les données depuis calendar.md
        const calendarFile = this.app.vault.getAbstractFileByPath('calendar.md');
        console.log('calendarFile:', calendarFile);

        if (calendarFile instanceof TFile) {
            const content = await this.app.vault.read(calendarFile);
            console.log('content:', content);

            // Parser les âges
            this.ages = this.parseAges(content);
            console.log('ages:', this.ages);

            // Parser les événements
            const events = this.parseEvents(content);
            console.log('events:', events);

            // Vérifier si des événements ont été extraits
            if (events.length > 0) {
                // Créer la visualisation
                this.createTimeline(container, events);
            } else {
                container.createEl('p', { text: 'Aucun événement trouvé dans calendar.md.' });
            }
        } else {
            console.log('Le fichier calendar.md est introuvable.');
            container.createEl('p', { text: 'Le fichier calendar.md est introuvable.' });
        }
    }

    async onClose() {
        // Nettoyer le contenu si nécessaire
        const container = this.contentEl;
        container.empty();
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
        }

        return ages;
    }

    parseEvents(content: string): Event[] {
        let events: Event[] = [];

        const eventsSection = content.split('## Événements')[1];
        if (eventsSection) {
            const eventRegex = /-\s*\*\*(.*?)\*\*\s*:\s*(.*?)\s*\n\s*-\s*Description\s*:\s*(.*?)(?=\n-\s*\*\*|$)/gs;
            let match;
            while ((match = eventRegex.exec(eventsSection)) !== null) {
                const dateStr = match[1].trim();

                // Extraire l'âge depuis la date en utilisant l'expression régulière
                const ageMatch = dateStr.match(/du\s+(\d+)(?:er|e|ème)?\s+âge/);
                const ageNumber = ageMatch ? parseInt(ageMatch[1]) : 0;

                const event: Event = {
                    date: dateStr,
                    title: match[2].trim(),
                    description: match[3].trim(),
                    numericDate: this.convertDateToNumber(dateStr),
                    age: ageNumber
                };
                events.push(event);
            }
        }

        return events;
    }

    convertDateToNumber(dateStr: string): number {
        // Exemple : "3 Clar de Massié, Année 30 du 7e âge"
        const jours = ['Clar', 'Flume', 'Éther', 'Armon', 'Flok', 'Mété', 'Chir'];
        const mois = ['Massié', 'Rasser', 'Finci', 'Été', 'Visir', 'Comir', 'Arnie', 'Elzeryn', 'Automne', 'Ōure', 'Weelk', 'Frîrr', 'Hiver', 'Aulbe', 'Scholl', 'Midnay', 'Cabir'];

        const dateRegex = /(\d+)\s+([\p{L}]+)\s+de\s+([\p{L}]+),\s+Année\s+(\d+)\s+du\s+(\d+)(?:er|e|ème)?\s+âge/u;
        const match = dateStr.match(dateRegex);
        if (match) {
            const day = parseInt(match[1]);
            const dayName = match[2];
            const monthName = match[3];
            const year = parseInt(match[4]);
            const age = parseInt(match[5]);

            // Vérifier que le jour et le mois existent
            if (!jours.includes(dayName)) {
                console.error('Jour invalide:', dayName);
                return 0;
            }
            if (!mois.includes(monthName)) {
                console.error('Mois invalide:', monthName);
                return 0;
            }

            // Calculer le total des jours
            let totalDays = 0;

            // Ajouter les jours des âges précédents
            for (let i = 0; i < this.ages.length; i++) {
                if (this.ages[i].number < age) {
                    totalDays += this.ages[i].duration * 14 * 30; // 14 mois * 30 jours
                } else {
                    break;
                }
            }

            // Trouver l'âge actuel
            const currentAge = this.ages.find(a => a.number === age);
            if (!currentAge) {
                console.error('Âge invalide:', age);
                return 0;
            }

            // Ajouter les années dans l'âge actuel
            totalDays += (year - currentAge.startYear) * 14 * 30;

            // Ajouter les mois
            const monthIndex = mois.indexOf(monthName);
            totalDays += monthIndex * 30;

            // Ajouter le jour
            totalDays += day;

            return totalDays;
        } else {
            console.error('Date invalide:', dateStr);
            return 0;
        }
    }

    formatDateFromNumeric(numericDate: number): string {
        let remainingDays = numericDate;
        for (let i = 0; i < this.ages.length; i++) {
            const age = this.ages[i];
            const ageDurationDays = age.duration * 14 * 30;
            if (remainingDays < ageDurationDays) {
                const yearInAge = Math.floor(remainingDays / (14 * 30)) + age.startYear;
                return `An ${yearInAge} du ${age.number}e âge`;
            } else {
                remainingDays -= ageDurationDays;
            }
        }
        return `Date inconnue`;
    }

    createTimeline(container: HTMLElement, events: Event[]) {
        console.log('createTimeline called with events:', events);

        // Supprimer tout contenu précédent
        container.empty();

        // Définir les dimensions
        const width = container.clientWidth || 800;
        const height = 500;

        console.log('Container width:', width);
        console.log('Container height:', height);

        // Créer le canevas SVG
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

            // Adapter la taille des cercles
            g.selectAll('circle')
                .attr('r', 10 / event.transform.k);

            // Adapter la taille des polices
            g.selectAll('text')
                .style('font-size', `${12 / event.transform.k}px`);
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

        // Ajouter l'axe temporel
        const xAxis = d3.axisBottom(xScale)
            .ticks(10)
            .tickFormat(d => this.formatDateFromNumeric(d as number));

        g.append('g')
            .attr('transform', `translate(0, ${height - 50})`)
            .call(xAxis);

        // Créer une échelle de couleurs pour les âges
        const colorScale = d3.scaleOrdinal<number, string>()
            .domain(Array.from(new Set(events.map(d => d.age))))
            .range(d3.schemeCategory10);

        // Calculer les positions verticales des labels pour éviter les chevauchements
        events.forEach((event, index) => {
            const xPos = xScale(event.numericDate);
            let yPos;

            // Alterner les labels au-dessus et en dessous de la timeline
            if (index % 2 === 0) {
                yPos = (height / 2) - 30; // Au-dessus de la timeline
                event.labelAlignment = 'top';
            } else {
                yPos = (height / 2) + 30; // En dessous de la timeline
                event.labelAlignment = 'bottom';
            }

            event.labelY = yPos;
        });

        // Ajouter les événements
        g.selectAll('circle')
            .data(events)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.numericDate))
            .attr('cy', height / 2)
            .attr('r', 10)
            .attr('fill', d => colorScale(d.age))
            .on('mouseover', (event, d) => {
                const [mouseX, mouseY] = d3.pointer(event);
                // Afficher une info-bulle ou un tooltip
                const tooltip = d3.select(container)
                    .append('div')
                    .attr('class', 'tooltip')
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 28) + 'px')
                    .html(`<strong>${d.title}</strong><br/>${d.date}<br/>${d.description}`);
            })
            .on('mouseout', () => {
                d3.select(container).select('.tooltip').remove();
            });

        // Ajouter les labels des événements
        g.selectAll('text.event-label')
            .data(events)
            .enter()
            .append('text')
            .attr('class', 'event-label')
            .attr('x', d => xScale(d.numericDate))
            .attr('y', d => d.labelY!)
            .attr('text-anchor', 'middle')
            .text(d => d.title)
            .style('font-size', '12px');

        // Ajouter des lignes reliant les labels aux cercles
        g.selectAll('line.label-line')
            .data(events)
            .enter()
            .append('line')
            .attr('class', 'label-line')
            .attr('x1', d => xScale(d.numericDate))
            .attr('y1', height / 2)
            .attr('x2', d => xScale(d.numericDate))
            .attr('y2', d => d.labelY! + (d.labelAlignment === 'top' ? 5 : -5)) // Ajuster en fonction de l'alignement
            .attr('stroke', 'var(--text-muted)')
            .attr('stroke-dasharray', '2,2');
    }
}
