# Typhooon

Minimal functional reactive library for forgetful developers. Zero-dependency, performant and elegant (~300 LOCs), shared the same API as JavaScript native Array and Promise.

- No custom API. Every operators are the same as native Array + Promise operators like `map`, `reduce`, `filter`, `then`. But you can use them to easily combine to more powerful operators like `merge`,`fold`, `flatten`.
- Can be created from simple value, Promise, Generator, DOM mutation observer, and Events. Or use stream constructor to build your custom stream.
- No more custom terminology, only **streams**.
- Support official Binding to React, like react-redux for redux. You can integrate typhooon with the react apps super easily.

## Why

We all know functional reactive programming is great for front-end web application with complicated interaction, and Rxjs are really powerful. But someone like me just cannot remember all the operators and terminology in Rxjs. For some use cases, why not just use a minimal abstrction for reactive programming? Here is Typhooon.

## Demo

**Work in Progress**

- [Debounce input](demo/debounce.js)

- Github repository lists
- [React-Typhoon](demo/react.js)



## Installation

```shell
npm install --save typhooon
```



## API & Operators

The same as [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) and [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise). Please note some operators are working in progress, may not be compatible with the spec.



## Example

```javascript
import Typhooon from 'typhooon'
const stream = new Typhooon((next, error) => {
  next(1)
  next(2)
  error(3)
})
stream
  .map(val => val + 1)
  .catch(err => console.error(err))
```



## Roadmap

1. Finish Array operators
2. Finish Promise operators
3. Comments
4. Test
5. Map, Set, iterator support
6. scheduler




## Why Call It 'Typhooon'

I made this library in a night with a strong typhoon incoming (I live in Taiwan). It's too destructive that double 'o' cannot describe its power.




## Contributing

Contributions are welcome and encouraged!



## License

MIT