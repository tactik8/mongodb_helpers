
# Installation
```
npm install github:tactik8/jsonldHelpers_v1
```


## Development
for development continuous :
```
npx nodemon index.js
```

## Build
for packaging:
```
npx @vercel/ncc build src/index.js -m -o dist
```

```
npx esbuild src/index.js --bundle --minify --platform=node --format=esm --outfile=dist/index.js
```
