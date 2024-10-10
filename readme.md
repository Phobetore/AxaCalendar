# Custom Calendar Timeline

## Overview

Custom Calendar Timeline is a plugin for Obsidian that allows users to display a customized timeline based on a fictional calendar. This plugin is designed to enhance time-based visualizations within Obsidian, leveraging the power of the D3 library for creating interactive timelines.

## Features

- Create and display a timeline using a custom calendar.
- Full integration with Obsidian's ecosystem, supporting version 0.12.0 and above.
- Built using TypeScript for strong typing and D3 for flexible visualizations.
- Customizable timeline events based on user-defined dates.

## Installation

1. Download the latest release of the plugin from the [releases page](https://github.com/ChaosLayer/CustomCalendarTimeline).
2. Extract the files into your Obsidian vault's plugins folder.
   - Path: `<vault>/.obsidian/plugins/custom-calendar-timeline/`
3. Enable the "Custom Calendar Timeline" plugin from Obsidian's settings.

## Development Setup

To set up the development environment for the plugin:

1. Clone the repository:

   ```bash
   git clone https://github.com/ChaosLayer/CustomCalendarTimeline.git
   cd CustomCalendarTimeline
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the plugin:

   ```bash
   npm run build
   ```

4. To start development mode with live-reloading:

   ```bash
   npm run dev
   ```

## Usage

Once installed and activated, the plugin will add a new panel in Obsidian for creating and managing timelines. You can define custom events and dates based on your unique calendar system.

## Requirements

- Obsidian 0.12.0 or higher.
- Node.js and npm for development purposes.

## Contributing

We welcome contributions! Please follow these steps to contribute:

1. Fork the repository.
2. Create a new branch for your feature or bugfix.
3. Submit a pull request for review.