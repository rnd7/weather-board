# Weather Board
The Weather Board is a simple, self hosted, realtime collaborative 2D textbuffer. I wanted it to look like an old school terminal. What differs is that you can type and scroll in every direction and that the position of every character is fixed. Everything free as in beer.

# Basic Usage

It is a service, an application, a command, a micro framework and an attempt to find best practices developing a modern pure ES6 application without any pain.

## Try the service
This is hosted on my dev server in my living room. Don't expect high availability, I might turn it off from time to time. If the request times out this is probably the case.

[https://weatherboard.dynv6.net/](https://weatherboard.dynv6.net/)

## Run as command
To tryout locally you can run the following command. Node.js has to be installed on your local machine. The command installs the server and all dependencies temporarily and spawns a process using the default configuration. Data is not guaranteed to be persisted, as long as you don't define a database path.

Type this in your preferred Terminal.

```
npx -y weather-board
```

When the procedure is completed navigate to this link

[http://localhost:3000](http://localhost:3000)


## Use as module
You can use the Weather Board or parts of it in your project. Be sure to initialize a npm project before installing weather-board as dependency. 

### Installation
Download and install using your favorite package manager.

Using npm.
```
npm i weather-board
```
Alternatively, if you prefer yarn.
```
yarn add weather-board
```

### Run application
After installation you can start the service using the following command.

```
npm exec weather-board
```

Basically the same as this command.
```
node node_modules/weather-board/src/index.js
```

### Import Client
If you want to customize the Weather Board Client instead of just running the service you write your own app using the modules provided.

As an example create an new folder, run npm init, install weather-board as dependency and finally create a file named index.html containing following code.

Assuming you do not want to bundle your source code you can import the modules using relative paths instead of using the bare module name. The files are imported from the src directory using functionality provided by the included http server.

```html
<!DOCTYPE html>
<html>
    <body>
        <script type="module">
            import WeatherBoard from './client/weather-board.js'
            // Use the create helper to define and create a WebComponent
            document.body.append(WeatherBoard.create())
        </script>
    </body>
</html>
```

## Import Server
To continue the example, create a file called server.js and insert the following code.

```javascript
import {
    WeatherBoardSqlite,
    WeatherBoardHTTP,
    WeatherBoardServer
} from 'weather-board'

// Create new database relative to your project dir
const storageAdapter = new WeatherBoardSqlite({cwd: '.', databasePath:'path/to/the.db'})
// Configure webserver to serve your custom index.html instead of the default one.
const http = new WeatherBoardHTTP({port: 3001, indexPath: './index.html'})
// Start the server
const server = new WeatherBoardServer(storageAdapter, http.server)
```

Afterwards launch your application from the commandline using

```
node server.js
```

To test it in your browser navigate to

[http://localhost:3001](http://localhost:3001)

The included WeatherBoardHTTP is based on express. It can be configured to serve files from other directories and further routes can be added.

If you decide to roll you own server, you can replace the HTTP Server with your implementation and just pass a Node.js http.Server instance to the WeatherBoardServer class constructor.

If you want to use another storage solution you can provide one with a matching interface. By now only sqlite is supported, a Postgre port should be quite straightforward.

## Use with bundler
Even if this application is designed to work without the use of a bundler like webpack or parcel you might choose to use one. In this case you may want to import the client module defined in the package.json instead of using relative paths.

```javascript
import { WeatherBoard } from 'weather-board'
document.body.append(WeatherBoard.create())
```

## Clone the repo
In order to mess around with the original source code, you should consider cloning the repo. In this case changes in the original repo might lead to incompatibilites that are hard to merge. 

```
git clone https://github.com/rnd7/weather-board.git
```


# Application

## Client
The client consist of various pure ECMAScript Web Components build around a responsive grid layout component. I am still annoyed that using Web Components everything ist beautifully encapsulating but the name has to be defined globally using the CustomElementRegistry spamming a global namespace. I tried to work around a bit. That being said, I'm enjoying the general concept and it kind of feels right. 

HTML templates are not used, the layout is low-complexity and templates seemednot beneficial in this case. 

The client is designed to be served non-bundled using browser module imports.

## Server
The server setup is self contained. It serves http requests, manages socket connections,
provides an WebSocket API and stores data in a sqlite database.

No dynamic data is served as response to an http request so browserside caching works great and express should be sufficient to serve static files, at least for the scale I expect and the socket server is able to manage.

The server uses a sqlite storage adapter. The library used is intentional synchronous but the abstraction is asynchronous, this is for sure a performance tradeoff.

# Modules

## Server Module Classes


| class | file | description |
|---|---|---|
|WeatherBoardServer|src/server/weather-board-server.js|Weather Board socket server
|WeatherBoardHTTP|src/server/weather-board-http.js|Weather Board HTTP Server
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

# License

All sources are MIT-Licensed. Feel free to use it as whole or in parts in any context.

# No bottom in sight.

The deeper I dived, The more I've learned. My primary concern was to write a pure ES6 application that runs in any modern browser without any preprocessing, transpiling and all the time-consuming toolchain bells and whistles. I wanted to get rid of all UI libraries, nothing reacts angular to vues anymore. I wanted to really understand pointer events, find best practices regarding WebComponents, explore the possiblilites of OOP ES6 and trying to be precise. Loosely coupled Components, a decentralized state. No large scale design pattern, just what emerges from the technology used.

The server, on the other hand, is rather conservative. I was keen to use the same codebase for server and client without splitting into individual packages. Just one repo, one package. No upgrades, nor conflicting versions. Global refactoring out of the box. What you write is what you get, just a single source of truth. Everything served steaming hot from the src dir.

After this experiment, it seems to me that the native APIs available provide almost everything that is necessary to develop a flexible, performant and scalable application. Most of the pain is gone. I feel in control. Of course this applies only as long as you don't care about backwards compatibility. I decided not to like private class properties and stayed with a prefixed names. I'd love to have private and protected keywords, perhaps access modifiers are a stupid idea anyways.