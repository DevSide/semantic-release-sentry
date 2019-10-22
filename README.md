# semantic-release-sentry

semantic-release plugin to resolve Sentry issues via commit messages

## Install

```bash
$ npm install semantic-release-sentry -D
```

## Usage

The plugin can be configured in the [**semantic-release** configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```json5
{
  "plugins": [
    ["semantic-release-sentry", {
      // required, environment variable which stores the token value
      "sentryTokenVar": "SENTRY_TOKEN",

      // optinal, default is 20
      "networkConcurrency": 42, 
    }],
  ]
}
```
