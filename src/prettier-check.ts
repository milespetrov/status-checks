import exec from '@actions/exec'
import {info, warning} from '@actions/core'
import type {ActionInterface, PrettierResults} from './constants.js'

export async function run(action: ActionInterface): Promise<PrettierResults> {
  const result = await exec.getExecOutput(action.inputs.prettierCommand, [], {
    ignoreReturnCode: true
  })

  const regex = /\[warn\]/gm
  let m
  let output: PrettierResults = {failed: false}

  if ((m = regex.exec(result.stdout)) !== null) {
    output.failed = true
    warning('Prettier check failed!')
  } else {
    info(`Prettier check has passed!`)
  }
  return output
}
