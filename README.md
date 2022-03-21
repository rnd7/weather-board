# Weather Board
The Weather Board is a simple, self hosted, realtime collaborative 2D textbuffer. I wanted it to look like a old school terminal where you can type and scroll in every direction.

# The repository

It is an application, a micro framework and an attempt to find best practices developing a modern pure ES6 application without any pain. 


# No bottom in sight.

The deeper I dived, The more I've learned. My primary concern was to write a pure ES6 application that runs in any modern browser without any preprocessing, transpiling and all the time-consuming toolchain bells and whistles. I wanted to get rid of all UI libraries, really understand pointer events, find best practices regarding WebComponents, explore the possiblilites of OOP ES6 and trying to be precise. 

The server, on the other hand, is rather conservative. I was keen to use the same codebase for server and client without splitting into individual packages. Just one repo, one package. No upgrades, nor conflicting versions. Global refactoring out of the box. What you write is what you get. 

After this experiment, it seems to me that the native APIs available provide almost everything that is necessary to develop a flexible, performant and scalable application. Most of the pain is gone. I feel in control. Of course this applies only as long as you don't care about backwards compatibility. I decided not to like private class properties and stayed with a prefixed names. I'd love to have private and protected keywords, perhaps access modifiers are a stupid idea anyways.

# Application

## Client
The client consist of various pure ECMAScript Web Components build around a responsive grid layout component. I am still annoyed that everything ist beautifully encapsulating but the name has to be defined globally using the CustomElementRegistry spamming a global namespace. I tried to work around a bit. That being said, I'm enjoying the general concept and it kind of feels right. 

HTML templates are not used, the layout is low-complexity and templates seemednot beneficial in this case. 

## Server
The server is self contained. It serves http requests, manages socket connections,
provides an WebSocket API and stores data in a sqlite database.

No dynamic data is served as response to an http request so browserside caching works great and express should be sufficient to serve static files.

The server uses a sqlite storage adapter. This library used is

# Modules

## Server Module Classes


| class | file | description |
|---|---|---|
|WeatherBoardServer|src/server/weather-board-server.js|Weather Board socket server
|WeatherBoardSqlite|src/server/weather-board-sqlite.js|SQLite Storage Adapter

## Shared Module Classes

| class | file | description |
|---|---|---|
|APIEvent|src/shared/api-event.js|Events emitted by the server
|APIMethod|src/shared/api-method.js|Events handled by the server

## Browser Module Classes

| class | file | description |
|---|---|---|
|WeatherBoard|src/client/weather-board.js|Weather Board Web Component
|WeatherBoardAPI|src/client/weather-board-api.js|Weather Board API client
|WeatherBoardDataProvider|src/client/weather-board-data-provider.js|Manages loading of grid cells using quandrants
|PointerManager|src/client/util/pointer-manager.js|Generic pointer event manager
|Component|src/client/util/component.js|Generic web component base class
|EventDispatcher|src/client/util/event-dispatcher.js|Generic event dispatcher
|Color|src/client/config/color.js|Weather Board colors palette
|DefaultText|src/client/config/default-text.js|Weather Board default texts and labels
|StyleValue|src/client/config/style-value.js|Weather Board theme definition
|StyleMixin|src/client/config/style-mixin.js|CSS properties templates
|Style|src/client/config/style-mixin.js|CSS style templates


## Browser Module functions

| function | file | description |
|---|---|---|
|compile|src/client/weather-board-script.js|Weather Board scripting language parser and interpreter


# Architecture
Somehow different from most of what I coded before.

* Get rid of the toolchain. No preprocessing, no transpiling, no more waiting. Goodbye Sass, TypeScript, Webpack, Babel and all the other fellows.
* Discard old habits. No UI Library, nothing reacts angular to vues anymore. No pointer event library. Less abstraction.
* Loosely coupled Components, a decentralized state, no large scale design pattern just what emerges from the technology used.
* Single source of truth. Everything served steaming hot from the src dir.
* Make it easy for IDE to typecheck and autocomplete
* Combine server and client modules as well as the actual application in one universal package and repository.
* Explore the possibilities of OOP ES6.

