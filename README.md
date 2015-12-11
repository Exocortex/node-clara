# Clara.io api bindings for node.js

## Installation

`npm install clara`

## API Overview

Create a `clara` instance with your api token and username:

```js
// Visit https://clara.io/settings/api for your api token
var clara = require('clara')('your-api-token', 'your-username');
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
$ clara scenes:get  --apiToken <apiToken> --username <username> <sceneId>
```

## Available resources and methods

* scenes
  * [`get(params)`](https://clara.io/learn/sdk/api/list-scenes)
  * [`list(params)`](https://clara.io/learn/sdk/api/list-scenes)
  * [`create(params)`](https://clara.io/learn/sdk/api/create-scene)
  * [`update(params)`](https://clara.io/learn/sdk/api/update-scene)
  * [`import(params)`](https://clara.io/learn/sdk/api/import)

## Configuration

## Development

Run the tests using npm:

```bash
$ npm install
$ npm tests
```
