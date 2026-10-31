# @lp-labs/react-url-state

Schema-driven URL search state for filters, paging and tabs. React 18+ peer only; TypeScript, ESM and CommonJS included.

## Installation

```sh
npm install @lp-labs/react-url-state
```

## Quick Start

```jsx
import { useUrlState, stringParam, numberParam } from '@lp-labs/react-url-state';
const schema = { query: stringParam(), page: numberParam(1, 1, 1000) };
export default function Example() {
  const url = useUrlState(schema);
  return (
    <input
      aria-label="Search"
      value={url.state.query}
      onChange={(event) => url.setState({ query: event.target.value, page: 1 })}
    />
  );
}
```

## API

`useUrlState(schema,{mode='replace',maxLength=8192})` returns `state`, `setState(partialOrUpdater):boolean`, `error`, `hydrated`. A codec implements parse(string|null) and serialize(value):string|null; null removes the parameter. Built-ins: `stringParam(default='',maxLength=2048)`, `numberParam(default=0,min,max)`, `booleanParam(default=false)`. Defaults render during SSR; hydration reads location. Updates preserve unrelated parameters, path and hash; popstate and same-tab package events synchronize hooks. External history calls must dispatch popstate or use your router's integration.

## Benefits

| Area             | Details                                              |
| ---------------- | ---------------------------------------------------- |
| Typed codecs     | Parse and serialize values through explicit schemas. |
| Safe URL updates | Preserve unrelated parameters, path, and hash.       |
| Bounded input    | Limit schema count, key lengths, and query bytes.    |

## Customization

| Area       | Details                                           |
| ---------- | ------------------------------------------------- |
| Schema     | Choose string, number, boolean, or custom codecs. |
| History    | Select push or replace navigation behavior.       |
| Validation | Set bounds in codecs and query-length cap.        |

## Security And Limits

At most100 allowlisted schema keys; keys exclude prototype-related names. Query strings default to8192 UTF-8 bytes and cap at32768. Writes use URLSearchParams, not string concatenation or HTML. Codecs must validate custom values and avoid throwing for missing input. URLs leak through history, logs, referrers and copied links: never encode secrets. This hook does not perform navigation, authentication or router coordination automatically.

## Support

[Donate via PayPal](https://www.paypal.me/LibinPrasanth). Author: [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/).

## License

MIT License. See the packaged [LICENSE](LICENSE) file.
