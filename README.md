# Ice to Plain

Convert Ice stuff to and from plain JS objects.
Supports `long`, `enum`, `struct`, `dictionary`, `exception` and `class`.

## Installation

    $ npm install ice-to-plain

## Usage

```ts
import {iceToPlain, iceFromPlain} from 'ice-to-plain';
import {isEqual} from 'lodash';

const plain = iceToPlain(someIceValue);
isEqual(someIceValue, iceFromPlain(plain));  // true

// only convert one level deep
const shallowPlain = iceToPlain(someIceValue, false);
isEqual(someIceValue, iceFromPlain(shallowPlain, false));  // true
```