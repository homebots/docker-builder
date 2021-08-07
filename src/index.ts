import { error, setFailed } from '@actions/core';
import { Action } from './action';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';

async function run() {
  try {
    const action = new Action(core, exec, fs);
    await action.run();
  } catch (e) {
    error(e);
    setFailed(String(e));
  }
}

run();
