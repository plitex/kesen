# Kesen (WORK IN PROGRESS)

An isomorphic Javascript DDP Client

## Install

```bash
$ yarn add kesen
```

## How to use

Auto init (Browser only):

```js
import Kesen, { Collection } from 'kesen';

// Create a collection
const Tasks = new Collection('tasks');

// Call a method
Kesen.call('insertTask', 'Destroy asteroids').then(
  result => console.log(result),
  error => console.log('Error:', error)
);

// Subscribe to reactive data
Kesen.track(subscribe => {
  const subsHandle = subscribe('tasks');
  if (subsHandle.ready) {
    console.log(Tasks.find().all());
  }
});
```

Custom init (default client):

```js
import { createClient, Collection } from 'kesen';

createClient('default', `ws//myhost:7890/ws`);

// Create a collection
const Tasks = new Collection('tasks');

// Call a method
Kesen.call('insertTask', 'Destroy asteroids').then(
  result => console.log(result),
  error => console.log('Error:', error)
);

// Subscribe to reactive data
Kesen.track(subscribe => {
  const subsHandle = subscribe('tasks');
  if (subsHandle.ready) {
    console.log(Tasks.find().all());
  }
});
```

## Examples

[Simple Todos React](https://github.com/plitex/kesen-simple-todos-react-example)
