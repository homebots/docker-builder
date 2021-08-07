import { Action } from './action';
import type Core from '@actions/core';
import type Exec from '@actions/exec';
import type FS from 'fs';

describe('test', () => {
  it('should create an image with custom version and configuration', async () => {
    const { core, exec, fs } = mocks({
      root: './host',
      registry: 'hub.docker.io',
      targets: ['folder', 'file.js'],
      'image-name': 'test',
      'service-config-path': 'service-config.json',
    });

    const action = new Action(core, exec, fs);
    const serviceConfiguration = '{"type": "node", "version": "14"}';
    const dockerfileContent = [
      'FROM hub.docker.io/node:14',
      'ADD host/folder /home/app/',
      'ADD host/file.js /home/app/',
      'RUN ls -al',
    ].join('\n');

    jest.spyOn(fs.promises, 'readFile').mockImplementation(() => Promise.resolve(serviceConfiguration));

    await expect(action.run()).resolves.toBe(undefined);

    expect(exec.exec).toHaveBeenCalledTimes(2);
    expect(exec.exec).toHaveBeenCalledWith('docker', ['build', '-t', 'hub.docker.io/test', './host']);
    expect(exec.exec).toHaveBeenCalledWith('docker', ['push', 'hub.docker.io/test']);

    expect(fs.promises.readFile).toHaveBeenCalledTimes(1);
    expect(fs.promises.readFile).toHaveBeenCalledWith('host/service-config.json', 'utf-8');

    expect(fs.promises.writeFile).toHaveBeenCalledTimes(1);
    expect(fs.promises.writeFile).toHaveBeenCalledWith('./Dockerfile', dockerfileContent);
  });

  it('should create an image with default values', async () => {
    const { core, exec, fs } = mocks({
      registry: 'd.homebots.io/v2',
      'image-name': 'test',
      'service-config-path': 'service.json',
      root: '.',
      targets: ['.'],
    });

    const action = new Action(core, exec, fs);
    const serviceConfiguration = '{"type": "node"}';
    const dockerfileContent = ['FROM d.homebots.io/v2/node:latest', 'ADD . /home/app/', 'RUN ls -al'].join('\n');

    jest.spyOn(fs.promises, 'readFile').mockImplementation(() => Promise.resolve(serviceConfiguration));

    await expect(action.run()).resolves.toBe(undefined);

    expect(exec.exec).toHaveBeenCalledTimes(2);
    expect(exec.exec).toHaveBeenCalledWith('docker', ['build', '-t', 'd.homebots.io/v2/test', '.']);
    expect(exec.exec).toHaveBeenCalledWith('docker', ['push', 'd.homebots.io/v2/test']);

    expect(fs.promises.readFile).toHaveBeenCalledTimes(1);
    expect(fs.promises.readFile).toHaveBeenCalledWith('service.json', 'utf-8');

    expect(fs.promises.writeFile).toHaveBeenCalledTimes(1);
    expect(fs.promises.writeFile).toHaveBeenCalledWith('./Dockerfile', dockerfileContent);
  });

  function mocks(inputs: Record<string, string | string[]>) {
    const core = {
      setFailed: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      getInput: jest.fn((key) => inputs[key]),
      getMultilineInput: jest.fn((key) => inputs[key]),
    } as unknown as typeof Core;

    const exec = {
      exec: jest.fn(),
    } as unknown as typeof Exec;

    const fs = {
      promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
      },
    } as unknown as typeof FS;

    return { core, exec, fs };
  }
});
