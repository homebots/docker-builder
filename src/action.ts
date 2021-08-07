import Path from 'path';
import type Core from '@actions/core';
import type Exec from '@actions/exec';
import type FS from 'fs';

interface ServiceConfiguration {
  type: string;
  version?: string;
  domain?: string;
}

export class Action {
  constructor(protected core: typeof Core, protected exec: typeof Exec, protected fs: typeof FS) {}

  async run() {
    const inputs = this.getInputs();
    const { registry, imageName, targets, extraCommands, root, serviceConfigPath } = inputs;
    const serviceConfiguration = await this.loadServiceConfiguration(Path.join(root, serviceConfigPath));
    const { type, version = 'latest' } = serviceConfiguration;
    const tagName = Path.join(registry, imageName);
    const baseImage = Path.join(registry, type + ':' + version);

    await this.createDockerfile(root, baseImage, targets, extraCommands);
    await this.exec.exec('docker', ['build', '-t', tagName, root]);
    await this.exec.exec('docker', ['push', tagName]);
  }

  async createDockerfile(root: string, baseImage: string, targets: string[], extraCommands: string[]) {
    const dockerfileLines = [`FROM ${baseImage}`];

    targets.forEach((target) => {
      const hostTarget = Path.join(root, target);
      dockerfileLines.push(`ADD ${hostTarget} /home/app/`);
    });

    dockerfileLines.push(`RUN ls -al`);
    dockerfileLines.push(...extraCommands);

    return await this.fs.promises.writeFile(Path.join(root, 'Dockerfile'), dockerfileLines.join('\n'));
  }

  async loadServiceConfiguration(configPath: string): Promise<ServiceConfiguration> {
    const config = await this.fs.promises.readFile(configPath, 'utf-8');

    return JSON.parse(config);
  }

  getInputs() {
    const options = { required: true };
    const { getInput, getMultilineInput } = this.core;

    return {
      root: getInput('root', options),
      imageName: getInput('image-name', options),
      registry: getInput('registry', options),
      targets: getMultilineInput('targets'),
      extraCommands: getMultilineInput('extra-commands') || [],
      serviceConfigPath: getInput('service-config-path'),
    };
  }
}
