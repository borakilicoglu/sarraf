# Config

Sadrazam loads config from either:

- `sadrazam.json`
- `package.json#sadrazam`

## Example

```json
{
  "reporter": "json",
  "production": false,
  "strict": false,
  "exclude": ["missing"],
  "ignorePackages": ["react"],
  "allowUnusedDependencies": [],
  "allowUnusedDevDependencies": ["typescript"],
  "allowMissingPackages": [],
  "allowMisplacedDevDependencies": [],
  "workspace": ["packages/web"],
  "ai": {
    "provider": "openai",
    "model": "gpt-4.1"
  }
}
```

CLI flags override config values.

## Supported Rule Keys

- `ignorePackages`
- `allowUnusedDependencies`
- `allowUnusedDevDependencies`
- `allowMissingPackages`
- `allowMisplacedDevDependencies`
