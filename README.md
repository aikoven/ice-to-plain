# Ice to Plain [![npm version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url]

Convert Ice stuff to and from plain JS objects.
Supports `long`, `enum`, `struct`, `dictionary`, `exception` and `class`,
as well as JS objects, arrays, Maps and Sets.

## Installation

    $ npm install ice-to-plain

## Usage

```ts
import {iceToPlain, iceToJson, iceFromPlain} from 'ice-to-plain';
import {isEqual} from 'lodash';

const plain = iceToPlain(someIceValue);
isEqual(someIceValue, iceFromPlain(plain)); // true

// 4-5x faster than JSON.stringify for Ice objects
// but 4-5x slower on regular JS objects
const json = iceToJson(someIceValue);
```

[npm-image]: https://badge.fury.io/js/ice-to-plain.svg
[npm-url]: https://badge.fury.io/js/ice-to-plain
[travis-image]: https://travis-ci.org/aikoven/ice-to-plain.svg?branch=master
[travis-url]: https://travis-ci.org/aikoven/ice-to-plain
