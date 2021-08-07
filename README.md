# Docker Builder for Homebots services

Builds and pushes a new Docker image with an app or microservice inside.

Use a prebuilt base image that runs anything from `/home/app` folder.
This action will just grab some files, add to the base image under `home/app` and push the new image to a repository.

## Inputs

#### image-name

String. Name of the image to build

#### registry

String. The registry to push the image to. Also used to find the base image, based on service type

#### targets

Multiline string. Paths to files/folders to be added to the image.

## File structure

A service has a json file in its root directory, called `service.json`

The only required field is `type`, which is the name of the service type.

Other options depend upon the service type.

# Example

```yaml
name: 'Build a node app'
on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: 'Checkout'
        uses: actions/checkout@v2

      - name: 'Build image'
        uses: homebots/docker-builder@v1
        with:
          image-name: app
          targets: |
            ./index.js
          extra-commands: |
            RUN npm install
            ENTRYPOINT [ "node", "index.js" ]

      - name: 'Check resulting image'
        run: docker run --rm -it app
```

# How it works

The registry + the service type are used to find the base image.

Then a Dockerfile is generated, using the base image, and the service is built.

That service is then tagged and pushed to the registry.
