# @nelts/messager

messager for nelts

# Usage

```bash
npm i @nelts/messager
```

by ts:

```ts
import { Base, Master, Worker, Agent } from '@nelts/messager';
const master = new Master<APP>(app);
const worker = new Worker<APP>(app, mpid);
const agent = new Agent<APP>(app, mpid);

[which target].receiveMessage(message, socket);
```

# License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2019-present, yunjie (Evio) shen
