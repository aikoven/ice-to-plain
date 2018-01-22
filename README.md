# Ice to Plain [![npm version][npm-image]][npm-url] [![Build Status][travis-image]]

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

[npm-image]: https://badge.fury.io/js/ice-to-plain.svg
[npm-url]: https://badge.fury.io/js/ice-to-plain
[travis-image]: https://travis-ci.org/aikoven/ice-to-plain.svg?branch=master
[travis-url]: https://travis-ci.org/aikoven/ice-to-plain
