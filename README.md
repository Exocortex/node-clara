# Clara.io api bindings for node.js

## Installation 

`npm install clara`

## Quick start

```bash
$ npm install clara
$ clara set apiToken <api-token>
$ clara set username <username>
$ clara scenes:get <uuid>
```

## API Overview

Create a `clara` instance with your api token and username:

```js
// Visit https://clara.io/settings/api for your api token
var clara = require('clara')({apiToken: 'your-api-token', username: 'your-username'});
```

Every resource method returns a promise, or accepts an optional callback.

```js
clara.scenes.list().then(function(scenes) {
}).catch(function(err) {
});
```

With callbacks:

```js
clara.scenes.list(function(err, scenes) {
});
```


## Command line overview

All commands are available from the command line runner as well.

```bash
$ clara --help
$ clara scenes:get --help
$ clara --apiToken <apiToken> --username <username> scenes:get <sceneId>
```

## Available resources and methods

* scenes
  * scenes:list [options]                List public scenes
  * scenes:create [options]              Create a new scene
  * scenes:update [options] <sceneId>    Update a scene
  * scenes:get <sceneId>                 Get scene data
  * scenes:delete <sceneId>              Delete a scene
  * scenes:clone <sceneId>               Clone a scene
  * scenes:import [options] <sceneId>    Import a file into the scene
  * scenes:export <sceneId> <extension>  Export a scene
  * scenes:render [options] <sceneId>    Render an image
  * set <key> <val>                      Set a configuration value to $HOME/.clara.json
  * get <key>                            Return the current configuration for <key>

## Configuration

There are several ways to set up the configuration data, from highest to lowest priority:

1. Pass directly (through function call, or command line).

```bash
clara --apiToken <apiToken> --username <username> scenes:get <sceneId>
```
Or with api:

```javascript
var clara = require('clara')({apiToken: '...', username: '...'});
```

2. Environment variables.

Any parameter can be passed through an environment variable, prefixed with `clara_`:

```bash
clara_apiToken=api-token-here clara_username=username clara scenes:get <uuid>
```

3. Configuration file in current working directory

A json file named `.clara.json` can hold configuration data:
```json
{
  "apiToken": "api-token-here",
  "username": "your-username"
}
```

4. Configuration file in $HOME

If the configuration file `.clara.json` exists in $HOME, it will be used.

###  clara set, clara get

You can use the clara command line to quickly set/get your configuration data. It will write
to `$HOME/.clara.json`:

```bash
$ clara set apiToken your-api-token
$ clara set username your-username
$ clara scenes:get scene-uuid
```


## Development

Run the tests using npm:

```bash
$ npm install
$ npm tests
```
