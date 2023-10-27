# DANFO JS

The danfo js library has a bug that has not been fixed in the current version, we must modify `node_modules` to include a patch to fix the bug.

You can read the patch information at the following links:

* [DANFO JS pull request](https://github.com/javascriptdata/danfojs/pull/562)
* [DANFO JS pull request files](https://github.com/javascriptdata/danfojs/pull/562/files)

```js
// File src/danfojs-base/core/frame.ts

if (typeof oldValue === 'number' && isNaN(oldValue)) {
  throw Error(`Params Error: Param 'oldValue' does not support NaN. Use DataFrame.fillNa() instead.`);
}
if (!oldValue && typeof oldValue !== 'boolean' && typeof oldValue !== 'number' && typeof oldValue !== 'string') {
  throw Error(`Params Error: Must specify param 'oldValue' to replace`);
}

// ...
if (!newValue && typeof newValue !== 'boolean' && typeof newValue !== 'number' && typeof newValue !== 'string') {
  throw Error(`Params Error: Must specify param 'newValue' to replace with`);
}
```

```js
// File src/danfojs-base/core/series.ts
if (typeof oldValue === 'number' && isNaN(oldValue)) {
  throw Error(`Params Error: Param 'oldValue' does not support NaN. Use Series.fillNa() instead.`);
}
if (!oldValue && typeof oldValue !== 'boolean' && typeof oldValue !== 'number' && typeof oldValue !== 'string') {
  throw Error(`Params Error: Must specify param 'oldValue' to replace`);
}

// ...
if (!newValue && typeof newValue !== 'boolean' && typeof newValue !== 'number' && typeof newValue !== 'string') {
  throw Error(`Params Error: Must specify param 'newValue' to replace with`);
}
```